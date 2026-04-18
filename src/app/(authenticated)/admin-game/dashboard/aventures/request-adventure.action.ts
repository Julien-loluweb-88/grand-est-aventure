"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import {
  canCreateAdventure,
  getAdminActorForAuthorization,
} from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import { AdminRequestStatus } from "@/lib/badges/prisma-enums";
import { notifySuperadminsNewAdventureRequest } from "@/lib/notify-superadmins-adventure-request";
import { queueAdminRequestClosedEmail } from "@/lib/user-lifecycle-emails";
import {
  ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS,
  ADMIN_REQUEST_TYPE_KEY_MAX_CHARS,
  ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS,
  ADVENTURE_REQUEST_MESSAGE_MAX_CHARS,
} from "@/lib/dashboard-text-limits";

const ADVENTURE_CREATION_KEY = "adventure_creation";
const DEFAULT_REQUEST_TYPES = [
  {
    key: "adventure_creation",
    label: "Création d’aventure",
    description: "Demande d’un admin pour créer une nouvelle aventure.",
  },
  {
    key: "badge_restock",
    label: "Réassort badges",
    description: "Demande d’ajout de stock de badges physiques sur une aventure.",
  },
] as const;

/** Crée les types métier par défaut s’ils manquent (`upsert` par `key`). Appelé à l’ouverture des Demandes et avant soumission d’une demande. */
export async function ensureDefaultAdminRequestTypes(actorUserId: string): Promise<void> {
  for (const item of DEFAULT_REQUEST_TYPES) {
    await prisma.adminRequestType.upsert({
      where: { key: item.key },
      create: {
        key: item.key,
        label: item.label,
        description: item.description,
        isActive: true,
        createdByUserId: actorUserId,
      },
      update: {},
    });
  }
}

export async function submitAdventureCreationRequest(message: string) {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { success: false as const, error: "Non autorisé." };
  }
  if (await canCreateAdventure()) {
    return {
      success: false as const,
      error:
        "Vous pouvez créer une aventure directement depuis le bouton « Créer une aventure ».",
    };
  }
  const user = await getUser();
  if (!user) {
    return { success: false as const, error: "Non autorisé." };
  }

  await ensureDefaultAdminRequestTypes(user.id);

  const trimmed = message.trim();
  if (trimmed.length > ADVENTURE_REQUEST_MESSAGE_MAX_CHARS) {
    return {
      success: false as const,
      error: `Message trop long (${ADVENTURE_REQUEST_MESSAGE_MAX_CHARS} caractères maximum).`,
    };
  }

  const requestType = await prisma.adminRequestType.findUnique({
    where: { key: ADVENTURE_CREATION_KEY },
    select: { id: true, isActive: true },
  });
  if (!requestType || !requestType.isActive) {
    return {
      success: false as const,
      error:
        "Le type de demande « création d’aventure » n’est pas disponible. Contactez un super administrateur.",
    };
  }

  const existingPending = await prisma.adminRequest.findFirst({
    where: {
      requesterId: user.id,
      requestTypeId: requestType.id,
      status: AdminRequestStatus.PENDING,
    },
    select: { id: true },
  });
  if (existingPending) {
    return {
      success: false as const,
      error:
        "Vous avez déjà une demande en attente. Un super administrateur la traitera sous peu.",
    };
  }

  const created = await prisma.adminRequest.create({
    data: {
      requestTypeId: requestType.id,
      requesterId: user.id,
      message: trimmed.length > 0 ? trimmed : null,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "adventure.creation_requested",
      actorUserId: actor.id,
      targetUserId: null,
      payload: {
        requestId: created.id,
        hasMessage: Boolean(created.message),
      },
    },
  });

  try {
    await notifySuperadminsNewAdventureRequest({
      requestId: created.id,
      requesterName: user.name,
      requesterEmail: user.email,
      message: created.message,
    });
  } catch (e) {
    console.error("[adventure request] notification superadmins:", e);
  }

  revalidatePath("/admin-game/dashboard/demandes");
  revalidatePath("/admin-game/dashboard/journal-admin");
  return { success: true as const };
}

/** Toutes les demandes admin (tous types) — superadmin. */
export async function listAdminRequests() {
  const actor = await getAdminActorForAuthorization();
  if (!actor || !isSuperadmin(actor.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }

  await ensureDefaultAdminRequestTypes(actor.id);

  const requests = await prisma.adminRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 400,
    include: {
      requester: { select: { id: true, email: true, name: true } },
      requestType: { select: { key: true, label: true } },
      adventure: { select: { id: true, name: true } },
    },
  });

  return { ok: true as const, requests };
}

export async function listAdminRequestTypes() {
  const actor = await getAdminActorForAuthorization();
  if (!actor || !isSuperadmin(actor.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }
  await ensureDefaultAdminRequestTypes(actor.id);
  const types = await prisma.adminRequestType.findMany({
    orderBy: [{ isActive: "desc" }, { key: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      description: true,
      isActive: true,
      createdAt: true,
    },
  });
  return { ok: true as const, types };
}

export async function createAdminRequestType(input: {
  key: string;
  label: string;
  description?: string;
}) {
  const actor = await getAdminActorForAuthorization();
  if (!actor || !isSuperadmin(actor.role)) {
    return { success: false as const, error: "Non autorisé." };
  }

  const key = input.key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const label = input.label.trim();
  const descriptionRaw = input.description?.trim() ?? "";
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;

  if (key.length < 3 || key.length > ADMIN_REQUEST_TYPE_KEY_MAX_CHARS) {
    return {
      success: false as const,
      error: `La key doit contenir entre 3 et ${ADMIN_REQUEST_TYPE_KEY_MAX_CHARS} caractères (a-z, 0-9, _).`,
    };
  }
  if (label.length < 3 || label.length > ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS) {
    return {
      success: false as const,
      error: `Le libellé doit contenir entre 3 et ${ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS} caractères.`,
    };
  }
  if (description && description.length > ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS) {
    return {
      success: false as const,
      error: `La description ne peut pas dépasser ${ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS} caractères.`,
    };
  }

  try {
    await prisma.adminRequestType.create({
      data: {
        key,
        label,
        description,
        isActive: true,
        createdByUserId: actor.id,
      },
    });
    revalidatePath("/admin-game/dashboard/demandes");
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error:
        e instanceof Error && /unique/i.test(e.message)
          ? "Cette key existe déjà."
          : "Impossible de créer le type.",
    };
  }
}

/** Clôturer une demande en attente (tous types) — superadmin. */
export async function markAdminRequestClosed(id: string) {
  const actor = await getAdminActorForAuthorization();
  if (!actor || !isSuperadmin(actor.role)) {
    return { success: false as const, error: "Non autorisé." };
  }

  const existing = await prisma.adminRequest.findFirst({
    where: { id, status: AdminRequestStatus.PENDING },
    select: {
      id: true,
      requestType: { select: { key: true, label: true } },
      requester: { select: { email: true, name: true } },
    },
  });
  if (!existing) {
    return { success: false as const, error: "Demande introuvable ou déjà traitée." };
  }

  await prisma.adminRequest.update({
    where: { id },
    data: {
      status: AdminRequestStatus.CLOSED,
      closedAt: new Date(),
      closedByUserId: actor.id,
    },
  });

  if (existing.requester.email) {
    queueAdminRequestClosedEmail({
      to: existing.requester.email,
      displayName: existing.requester.name?.trim() ?? "",
      requestLabel: existing.requestType.label,
      requestId: id,
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      action: "admin_request.closed",
      actorUserId: actor.id,
      payload: {
        requestId: id,
        requestTypeKey: existing.requestType.key,
      },
    },
  });

  revalidatePath("/admin-game/dashboard/demandes");
  revalidatePath("/admin-game/dashboard/journal-admin");
  return { success: true as const };
}
