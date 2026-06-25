import "server-only";

import type { Prisma } from "../../generated/prisma/client";
import { AdventureAudience } from "../../generated/prisma/client";
import { isAdminRole, isSuperadmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

/**
 * Filtre catalogue / listes visibles par tous les joueurs (sans compte démo).
 * Exclut les aventures `DEMO` et `DEVELOPMENT`.
 * `status` explicite `false` = désactivée ; `true` ou `null` = considérée active (schéma optionnel).
 */
export const publicCatalogAdventureWhere: Prisma.AdventureWhereInput = {
  audience: AdventureAudience.PUBLIC,
  OR: [{ status: true }, { status: null }],
};

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

  if (params.adventure.audience === AdventureAudience.DEVELOPMENT) {
    if (!isAdminRole(params.role)) {
      return false;
    }
    if (isSuperadmin(params.role)) {
      return true;
    }
    const assigned = await db.adminAdventureAccess.findUnique({
      where: {
        userId_adventureId: {
          userId: params.userId,
          adventureId: params.adventure.id,
        },
      },
      select: { id: true },
    });
    return Boolean(assigned);
  }

  // DEMO : tous les admins + liste blanche joueurs
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

const activeAdventureStatusWhere: Prisma.AdventureWhereInput = {
  OR: [{ status: true }, { status: null }],
};

/**
 * Filtre les avis listés selon les aventures visibles pour le lecteur.
 * - Anonyme : uniquement aventures catalogue (`PUBLIC` actives).
 * - Connecté : catalogue + démos autorisées + dev si droit (même règles que le jeu).
 */
export async function buildAdventureReviewVisibilityWhere(params: {
  viewerId: string | null;
  viewerRole: string | null | undefined;
}): Promise<Prisma.AdventureReviewWhereInput> {
  if (!params.viewerId) {
    return { adventure: publicCatalogAdventureWhere };
  }

  const viewerId = params.viewerId;
  const role = params.viewerRole;
  const adventureOr: Prisma.AdventureWhereInput[] = [publicCatalogAdventureWhere];

  if (isAdminRole(role)) {
    adventureOr.push({
      audience: AdventureAudience.DEMO,
      ...activeAdventureStatusWhere,
    });
  }

  if (isSuperadmin(role)) {
    adventureOr.push({
      audience: AdventureAudience.DEVELOPMENT,
      ...activeAdventureStatusWhere,
    });
  }

  const needDemoWhitelist = !isAdminRole(role);
  const needDevAssignments = isAdminRole(role) && !isSuperadmin(role);

  const [demoAccessRows, assignedRows] = await Promise.all([
    needDemoWhitelist
      ? prisma.adventureDemoAccess.findMany({
          where: { userId: viewerId },
          select: { adventureId: true },
        })
      : Promise.resolve([] as { adventureId: string }[]),
    needDevAssignments
      ? prisma.adminAdventureAccess.findMany({
          where: { userId: viewerId },
          select: { adventureId: true },
        })
      : Promise.resolve([] as { adventureId: string }[]),
  ]);

  if (demoAccessRows.length > 0) {
    adventureOr.push({
      id: { in: demoAccessRows.map((r) => r.adventureId) },
      audience: AdventureAudience.DEMO,
      ...activeAdventureStatusWhere,
    });
  }

  if (assignedRows.length > 0) {
    adventureOr.push({
      id: { in: assignedRows.map((r) => r.adventureId) },
      audience: AdventureAudience.DEVELOPMENT,
      ...activeAdventureStatusWhere,
    });
  }

  if (adventureOr.length === 1) {
    return { adventure: adventureOr[0]! };
  }
  return { adventure: { OR: adventureOr } };
}
