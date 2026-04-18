"use server";

import { durationToSeconds } from "@/utils/durationToSeconds";
import { dateToSeconds } from "@/utils/dateToSeconds";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  bridgeAdminUpdateUser,
  bridgeBanUser,
  bridgeListUserSessions,
  bridgeRemoveUser,
  bridgeRevokeUserSession,
  bridgeRevokeUserSessions,
  bridgeSetRole,
  bridgeSetUserPassword,
  bridgeUnbanUser,
} from "@/lib/better-auth-admin-bridge";
import {
  queueUserBannedEmail,
  queueUserUnbannedEmail,
} from "@/lib/user-lifecycle-emails";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import {
  requireRoutePermission,
  requireSuperadmin,
  requireUserPermission,
} from "./user-admin-guard";

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
  return bridgeAdminUpdateUser({
    userId: data.id,
    data: {
      name: data.name,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      country: data.country,
      phone: data.phone,
    },
  });
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
  await bridgeBanUser({
    userId,
    banReason: motif,
    ...(banExpiresIn && { banExpiresIn }),
  });
  const afterBan = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      banReason: true,
      banExpires: true,
    },
  });
  if (afterBan?.email) {
    queueUserBannedEmail({
      to: afterBan.email,
      displayName: afterBan.name?.trim() ?? "",
      reason: afterBan.banReason ?? motif,
      banExpires: afterBan.banExpires,
    });
  }
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
}

export async function unBanUser(userId: string) {
  await requireUserPermission("ban");

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  await bridgeUnbanUser({ userId });
  if (before?.email) {
    queueUserUnbannedEmail({
      to: before.email,
      displayName: before.name?.trim() ?? "",
    });
  }
  revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
  revalidatePath("/admin-game/dashboard/utilisateurs");
}

export async function roleUser(
  userId: string,
  role: "user" | "admin" | "superadmin" | "myCustomRole" | "merchant"
) {
  try {
    await requireSuperadmin();
    const actor = await getAdminActorForAuthorization();
    if (!actor) {
      return { success: false, message: "Non autorisé." };
    }
    const previousRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    await bridgeSetRole({
      userId,
      role,
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
    await bridgeRemoveUser({ userId });
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
  await requireSuperadmin();
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { success: false, message: "Non autorisé." };
  }

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

export async function setUserPasswordAsAdmin(userId: string, newPassword: string) {
  try {
    await requireRoutePermission("user", "set-password");
  } catch {
    return { success: false as const, message: "Non autorisé." };
  }
  try {
    await bridgeSetUserPassword({ userId, newPassword });
    revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
    return { success: true as const, message: "Mot de passe mis à jour." };
  } catch (e) {
    return {
      success: false as const,
      message: e instanceof Error ? e.message : "Impossible de définir le mot de passe.",
    };
  }
}

export async function revokeTargetUserSession(userId: string, sessionId: string) {
  try {
    await requireRoutePermission("session", "revoke");
  } catch {
    return { success: false as const, message: "Non autorisé." };
  }
  try {
    const listRes = await bridgeListUserSessions({ userId });
    const token = listRes?.sessions?.find((s) => s.id === sessionId)?.token;
    if (!token) {
      return { success: false as const, message: "Session introuvable." };
    }
    await bridgeRevokeUserSession({ sessionToken: token });
    revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
    return { success: true as const, message: "Session révoquée." };
  } catch (e) {
    return {
      success: false as const,
      message: e instanceof Error ? e.message : "Impossible de révoquer la session.",
    };
  }
}

export async function revokeAllTargetUserSessions(userId: string) {
  try {
    await requireRoutePermission("session", "revoke");
  } catch {
    return { success: false as const, message: "Non autorisé." };
  }
  try {
    await bridgeRevokeUserSessions({ userId });
    revalidatePath(`/admin-game/dashboard/utilisateurs/${userId}`);
    return { success: true as const, message: "Toutes les sessions ont été révoquées." };
  } catch (e) {
    return {
      success: false as const,
      message: e instanceof Error ? e.message : "Impossible de révoquer les sessions.",
    };
  }
}
