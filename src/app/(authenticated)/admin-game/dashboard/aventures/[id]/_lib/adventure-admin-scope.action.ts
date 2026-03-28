"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/auth-user";
import { isSuperadmin } from "@/lib/admin-access";

async function requireSuperadminActor() {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    return null;
  }
  return user;
}

export async function setAdventureAdminScopes(
  adventureId: string,
  adminUserIds: string[]
) {
  const actor = await requireSuperadminActor();
  if (!actor) {
    return { success: false as const, message: "Non autorisé." };
  }

  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { id: true },
  });
  if (!adventure) {
    return { success: false as const, message: "Aventure introuvable." };
  }

  const uniqueIds = [...new Set(adminUserIds)];

  if (uniqueIds.length > 0) {
    const count = await prisma.user.count({
      where: { id: { in: uniqueIds }, role: "admin" },
    });
    if (count !== uniqueIds.length) {
      return {
        success: false as const,
        message:
          "Un ou plusieurs comptes ne sont pas des administrateurs (rôle « admin »).",
      };
    }
  }

  const previous = await prisma.adminAdventureAccess.findMany({
    where: { adventureId },
    select: { userId: true },
  });
  const previousIds = previous.map((p) => p.userId);

  await prisma.$transaction(async (tx) => {
    await tx.adminAdventureAccess.deleteMany({ where: { adventureId } });
    if (uniqueIds.length > 0) {
      await tx.adminAdventureAccess.createMany({
        data: uniqueIds.map((userId) => ({ userId, adventureId })),
      });
    }
    await tx.adminAuditLog.create({
      data: {
        action: "adventure.admin.scope.updated",
        actorUserId: actor.id,
        targetUserId: null,
        payload: {
          adventureId,
          adminUserIds: uniqueIds,
        },
      },
    });
  });

  const affected = new Set([...previousIds, ...uniqueIds]);
  for (const uid of affected) {
    revalidatePath(`/admin-game/dashboard/utilisateurs/${uid}`);
  }

  revalidatePath(`/admin-game/dashboard/aventures/${adventureId}`);
  revalidatePath("/admin-game/dashboard/aventures");
  revalidatePath("/admin-game/dashboard/journal-admin");

  return {
    success: true as const,
    message: "Affectation des administrateurs enregistrée.",
  };
}
