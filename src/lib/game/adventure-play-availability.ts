import "server-only";

import { AdventureBadgeInstanceStatus } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildPlayAvailability,
  type AdventureMyReviewSnapshot,
  type AdventurePlayAvailability,
  type PlayAvailabilitySourceRow,
} from "./adventure-play-availability-core";

export type {
  AdventureMyReviewSnapshot,
  AdventurePhysicalBadgesAvailability,
  AdventurePlayAvailability,
  AdventureTreasureNotice,
  PlayAvailabilitySourceRow,
} from "./adventure-play-availability-core";

export { buildPlayAvailability, playAvailabilitySourceFromCatalogRow } from "./adventure-play-availability-core";

/** Compte les exemplaires AVAILABLE par aventure (batch). */
export async function batchLoadAvailablePhysicalBadgeCounts(
  adventureIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (adventureIds.length === 0) {
    return map;
  }

  const grouped = await prisma.adventureBadgeInstance.groupBy({
    by: ["adventureId"],
    where: {
      adventureId: { in: adventureIds },
      status: AdventureBadgeInstanceStatus.AVAILABLE,
    },
    _count: { _all: true },
  });

  for (const row of grouped) {
    map.set(row.adventureId, row._count._all);
  }
  return map;
}

export async function batchLoadMyReviewByUserAndAdventureIds(
  userId: string,
  adventureIds: string[]
): Promise<Map<string, AdventureMyReviewSnapshot>> {
  const map = new Map<string, AdventureMyReviewSnapshot>();
  if (adventureIds.length === 0) {
    return map;
  }

  const rows = await prisma.adventureReview.findMany({
    where: { userId, adventureId: { in: adventureIds } },
    select: {
      adventureId: true,
      reportsStolenTreasure: true,
      reportsMissingBadge: true,
      moderationStatus: true,
    },
  });

  for (const row of rows) {
    map.set(row.adventureId, {
      reportsStolenTreasure: row.reportsStolenTreasure,
      reportsMissingBadge: row.reportsMissingBadge,
      moderationStatus: row.moderationStatus,
    });
  }
  return map;
}

export async function batchBuildPlayAvailabilityByAdventureIds(
  sources: Array<{ adventureId: string; source: PlayAvailabilitySourceRow }>
): Promise<Map<string, AdventurePlayAvailability>> {
  const map = new Map<string, AdventurePlayAvailability>();
  if (sources.length === 0) {
    return map;
  }

  const idsNeedingBadgeCount = sources
    .filter((s) => s.source.physicalBadgeStockCount > 0)
    .map((s) => s.adventureId);

  const availableCounts = await batchLoadAvailablePhysicalBadgeCounts(idsNeedingBadgeCount);

  for (const { adventureId, source } of sources) {
    const availableBadgeCount = availableCounts.get(adventureId) ?? 0;
    map.set(adventureId, buildPlayAvailability(source, availableBadgeCount));
  }
  return map;
}
