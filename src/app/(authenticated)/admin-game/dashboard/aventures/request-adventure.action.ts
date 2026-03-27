"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperadmin } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import { notifySuperadminsNewAdventureRequest } from "@/lib/notify-superadmins-adventure-request";

export async function submitAdventureCreationRequest(message: string) {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { success: false as const, error: "Non autorisé." };
  }
  if (roleHasAdventurePermission(user.role, "create")) {
    return {
      success: false as const,
      error:
        "Vous pouvez créer une aventure directement depuis le bouton « Créer une aventure ».",
    };
  }
  const trimmed = message.trim();
  if (trimmed.length > 2000) {
    return { success: false as const, error: "Message trop long (2000 caractères maximum)." };
  }

  const existingPending = await prisma.adventureCreationRequest.findFirst({
    where: { requesterId: user.id, status: "pending" },
    select: { id: true },
  });
  if (existingPending) {
    return {
      success: false as const,
      error:
        "Vous avez déjà une demande en attente. Un super administrateur la traitera sous peu.",
    };
  }

  const created = await prisma.adventureCreationRequest.create({
    data: {
      requesterId: user.id,
      message: trimmed.length > 0 ? trimmed : null,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "adventure.creation_requested",
      actorUserId: user.id,
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

  revalidatePath("/admin-game/dashboard/demandes-aventures");
  revalidatePath("/admin-game/dashboard/journal-admin");
  return { success: true as const };
}

export async function listAdventureCreationRequests() {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    return { ok: false as const, error: "Non autorisé." };
  }

  const requests = await prisma.adventureCreationRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      requester: { select: { id: true, email: true, name: true } },
    },
  });

  return { ok: true as const, requests };
}

export async function markAdventureCreationRequestTreated(id: string) {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    return { success: false as const, error: "Non autorisé." };
  }

  await prisma.adventureCreationRequest.updateMany({
    where: { id, status: "pending" },
    data: { status: "treated" },
  });

  revalidatePath("/admin-game/dashboard/demandes-aventures");
  revalidatePath("/admin-game/dashboard/journal-admin");
  return { success: true as const };
}
