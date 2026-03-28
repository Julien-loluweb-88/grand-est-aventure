"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { durationToSeconds } from "@/utils/durationToSeconds";
import { dateToSeconds } from "@/utils/dateToSeconds";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin, requireUserPermission } from "./user-admin-guard";

export async function updateUser(data: {
  id: string;
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
}) {
  await requireUserPermission("update");
  const result = await auth.api.adminUpdateUser({
    body: {
      userId: data.id,
      data: {
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        phone: data.phone,
      },
    },
    headers: await headers(),
  });

  return result;
}

export async function banUser(
  userId: string,
  motif: string,
  duration: string,
  customEndDate?: string
) {
  await requireUserPermission("ban");
  const banExpiresIn =
    duration === "other" && customEndDate
      ? dateToSeconds(customEndDate)
      : durationToSeconds(duration);
  await auth.api.banUser({
    body: {
      userId,
      banReason: motif,
      ...(banExpiresIn && { banExpiresIn }),
    },
    headers: await headers(),
  });
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
}

export async function unBanUser(userId: string) {
  await requireUserPermission("ban");

  await auth.api.unbanUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
}

export async function roleUser(
  userId: string,
  role: "user" | "admin" | "superadmin" | "myCustomRole"
) {
  try {
    const actor = await requireSuperadmin();
    const previousRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    await auth.api.setRole({
      body: {
        userId,
        role,
      },
      headers: await headers(),
    });
    if (role !== "admin") {
      await prisma.adminAdventureAccess.deleteMany({ where: { userId } });
    }
    await prisma.adminAuditLog.create({
      data: {
        action: "user.role.updated",
        actorUserId: actor.id,
        targetUserId: userId,
        payload: {
          previousRole: previousRole?.role ?? null,
          newRole: role,
        },
      },
    });
    revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
    revalidatePath("/admin-game/dashboard/utilisateurs");
    revalidatePath("/admin-game/dashboard/journal-admin");
    return {
      success: true,
      message: "Rôle mis à jour.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur lors de la mise à jour du rôle.",
    };
  }
}

export async function removeUser(userId: string) {
  try {
    await requireUserPermission("delete");
  } catch {
    return {
      success: false,
      message: "Vous n’avez pas l’autorisation de supprimer des utilisateurs.",
    };
  }
  try {
    await auth.api.removeUser({
      body: {
        userId,
      },
      headers: await headers(),
    });
    revalidatePath("/admin-game/dashboard/utilisateurs");
    return {
      success: true,
      message: "L’utilisateur a été supprimé.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur.",
    };
  }
}

export async function setAdminAdventureRights(userId: string, adventureIds: string[]) {
  const actor = await requireSuperadmin();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false, message: "Utilisateur introuvable." };
  }

  if (targetUser.role !== "admin") {
    return {
      success: false,
      message:
        "Les droits sur les aventures ne s’appliquent qu’aux comptes avec le rôle « admin ».",
    };
  }

  const uniqueAdventureIds = [...new Set(adventureIds)];

  await prisma.$transaction(async (tx) => {
    await tx.adminAdventureAccess.deleteMany({ where: { userId } });
    if (uniqueAdventureIds.length > 0) {
      await tx.adminAdventureAccess.createMany({
        data: uniqueAdventureIds.map((adventureId) => ({ userId, adventureId })),
      });
    }
    await tx.adminAuditLog.create({
      data: {
        action: "admin.adventure.scope.updated",
        actorUserId: actor.id,
        targetUserId: userId,
        payload: {
          adventureIds: uniqueAdventureIds,
        },
      },
    });
  });

  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/aventures");
  revalidatePath("/admin-game/dashboard/journal-admin");

  return {
    success: true,
    message: "Droits admin mis à jour.",
  };
}
