"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { gateAdventureUpdateContent } from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import { AdminRequestStatus } from "@/lib/badges/prisma-enums";
import { notifySuperadminsBadgeRestockRequest } from "@/lib/notify-superadmins-badge-restock-request";

const MSG_MIN = 10;
const BADGE_RESTOCK_KEY = "badge_restock";

function parseOptionalQuantity(
  raw: string | number | null | undefined
): number | null {
  if (raw == null || raw === "") {
    return null;
  }
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1 || n > 100_000) {
    return null;
  }
  return n;
}

/** Demande de réassort adressée aux superadmin (admins de périmètre uniquement). */
export async function submitBadgeRestockRequest(
  adventureId: string,
  message: string,
  quantityRequested?: string | number | null
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  if (isSuperadmin(gate.actor.role)) {
    return {
      success: false,
      error:
        "En tant que super administrateur, utilisez la section « Stock badges physiques » pour réapprovisionner directement.",
    };
  }

  const text = message.trim();
  if (text.length < MSG_MIN) {
    return {
      success: false,
      error: `Le message doit contenir au moins ${MSG_MIN} caractères.`,
    };
  }

  const qty = parseOptionalQuantity(quantityRequested);

  try {
    const requestType = await prisma.adminRequestType.findUnique({
      where: { key: BADGE_RESTOCK_KEY },
      select: { id: true, isActive: true },
    });
    if (!requestType || !requestType.isActive) {
      return {
        success: false,
        error:
          "Le type de demande « réassort badges » n’est pas disponible. Contactez un super administrateur.",
      };
    }

    const adventure = await prisma.adventure.findUnique({
      where: { id: adventureId },
      select: { name: true },
    });
    if (!adventure) {
      return { success: false, error: "Aventure introuvable." };
    }

    const requester = await prisma.user.findUnique({
      where: { id: gate.actor.id },
      select: { name: true, email: true },
    });

    const row = await prisma.adminRequest.create({
      data: {
        requestTypeId: requestType.id,
        adventureId,
        requesterId: gate.actor.id,
        message: text,
        payload: qty != null ? { quantityRequested: qty } : undefined,
        status: AdminRequestStatus.PENDING,
      },
    });

    void notifySuperadminsBadgeRestockRequest({
      adventureId,
      adventureName: adventure.name,
      requestId: row.id,
      requesterName: requester?.name ?? null,
      requesterEmail: requester?.email ?? "",
      message: text,
      quantityRequested: qty,
    });

    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    revalidatePath("/admin-game/dashboard/demandes");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible d’enregistrer la demande.",
    };
  }
}

/** Marquer une demande comme traitée (superadmin). */
export async function closeBadgeRestockRequest(
  adventureId: string,
  requestId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await gateAdventureUpdateContent(adventureId);
  if (!gate.ok) {
    return { success: false, error: "Non autorisé." };
  }
  if (!isSuperadmin(gate.actor.role)) {
    return { success: false, error: "Réservé aux super administrateurs." };
  }

  try {
    const existing = await prisma.adminRequest.findFirst({
      where: {
        id: requestId,
        adventureId,
        requestType: { key: BADGE_RESTOCK_KEY },
        status: AdminRequestStatus.PENDING,
      },
    });
    if (!existing) {
      return { success: false, error: "Demande introuvable ou déjà traitée." };
    }

    await prisma.adminRequest.update({
      where: { id: requestId },
      data: {
        status: AdminRequestStatus.CLOSED,
        closedAt: new Date(),
        closedByUserId: gate.actor.id,
      },
    });

    revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
    revalidatePath("/admin-game/dashboard/demandes");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error:
        e instanceof Error ? e.message : "Impossible de clôturer la demande.",
    };
  }
}
