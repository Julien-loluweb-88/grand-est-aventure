import { prisma } from "@/lib/prisma";

export const ADMIN_ROLES = ["admin", "superadmin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function isSuperadmin(role: string | null | undefined): boolean {
  return role === "superadmin";
}

export async function canManageAdventure(params: {
  userId: string;
  role: string | null | undefined;
  adventureId: string;
}): Promise<boolean> {
  if (!isAdminRole(params.role)) {
    return false;
  }

  if (isSuperadmin(params.role)) {
    return true;
  }

  const access = await prisma.adminAdventureAccess.findUnique({
    where: {
      userId_adventureId: {
        userId: params.userId,
        adventureId: params.adventureId,
      },
    },
    select: { id: true },
  });

  return Boolean(access);
}

export async function getManagedAdventureIds(userId: string): Promise<string[]> {
  const accesses = await prisma.adminAdventureAccess.findMany({
    where: { userId },
    select: { adventureId: true },
  });

  return accesses.map((access) => access.adventureId);
}
