import "server-only";

import type { Prisma } from "../../generated/prisma/client";
import { AdventureAudience } from "../../generated/prisma/client";
import { isAdminRole } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

/**
 * Filtre catalogue / listes visibles par tous les joueurs (sans compte démo).
 * Exclut les aventures `audience: DEMO` (réservées admins + liste blanche).
 */
export const publicCatalogAdventureWhere = {
  status: true,
  audience: AdventureAudience.PUBLIC,
} as const;

export async function getUserRoleForAccess(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role ?? null;
}

export async function userCanAccessAdventureForPlay(
  db: DbClient,
  params: {
    userId: string;
    role: string | null | undefined;
    adventure: {
      id: string;
      status: boolean | null;
      audience: AdventureAudience;
    };
  }
): Promise<boolean> {
  if (params.adventure.status === false) {
    return false;
  }
  if (params.adventure.audience === AdventureAudience.PUBLIC) {
    return true;
  }
  if (isAdminRole(params.role)) {
    return true;
  }
  const row = await db.adventureDemoAccess.findUnique({
    where: {
      adventureId_userId: {
        adventureId: params.adventure.id,
        userId: params.userId,
      },
    },
    select: { id: true },
  });
  return Boolean(row);
}
