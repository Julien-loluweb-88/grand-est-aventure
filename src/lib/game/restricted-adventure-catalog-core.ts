import { AdventureAudience } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";
import { isAdminRole, isSuperadmin } from "@/lib/admin-access";

export const activeAdventureStatusWhere: Prisma.AdventureWhereInput = {
  OR: [{ status: true }, { status: null }],
};

export type RestrictedAdventureAudienceLabel = "DEVELOPMENT" | "DEMO";

export function restrictedAudienceLabel(
  audience: AdventureAudience
): RestrictedAdventureAudienceLabel {
  return audience === AdventureAudience.DEVELOPMENT ? "DEVELOPMENT" : "DEMO";
}

/**
 * Filtre Prisma des aventures hors catalogue accessibles au compte (DEMO / DEVELOPMENT actives).
 * `null` = aucune requête nécessaire (liste vide).
 */
export function buildRestrictedAdventureWhereInput(params: {
  role: string | null | undefined;
  demoWhitelistAdventureIds: string[];
  assignedDevelopmentAdventureIds: string[];
}): Prisma.AdventureWhereInput | null {
  const or: Prisma.AdventureWhereInput[] = [];

  if (isAdminRole(params.role)) {
    or.push({
      audience: AdventureAudience.DEMO,
      ...activeAdventureStatusWhere,
    });
  } else if (params.demoWhitelistAdventureIds.length > 0) {
    or.push({
      id: { in: params.demoWhitelistAdventureIds },
      audience: AdventureAudience.DEMO,
      ...activeAdventureStatusWhere,
    });
  }

  if (isSuperadmin(params.role)) {
    or.push({
      audience: AdventureAudience.DEVELOPMENT,
      ...activeAdventureStatusWhere,
    });
  } else if (
    isAdminRole(params.role) &&
    params.assignedDevelopmentAdventureIds.length > 0
  ) {
    or.push({
      id: { in: params.assignedDevelopmentAdventureIds },
      audience: AdventureAudience.DEVELOPMENT,
      ...activeAdventureStatusWhere,
    });
  }

  if (or.length === 0) {
    return null;
  }
  return { OR: or };
}

/** DEVELOPMENT avant DEMO, puis `updatedAt` décroissant. */
export function sortRestrictedAdventureRows<
  T extends { audience: AdventureAudience; updatedAt: Date },
>(rows: T[]): T[] {
  const audienceRank = (audience: AdventureAudience) =>
    audience === AdventureAudience.DEVELOPMENT ? 0 : 1;

  return [...rows].sort((a, b) => {
    const byAudience = audienceRank(a.audience) - audienceRank(b.audience);
    if (byAudience !== 0) return byAudience;
    const byDate = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (byDate !== 0) return byDate;
    return 0;
  });
}
