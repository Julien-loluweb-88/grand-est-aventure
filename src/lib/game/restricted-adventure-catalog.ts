import "server-only";

import { AdventureAudience } from "../../../generated/prisma/client";
import { isAdminRole, isSuperadmin } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import {
  attachDistanceFromUser,
  buildPlayAvailabilityMapForCatalogRows,
  catalogRowToPlayerStateBatchInput,
  publicCatalogSelect,
  toMobileAdventureListItem,
  type MobileAdventureListItem,
  type PublicCatalogAdventureRow,
} from "@/lib/game/mobile-adventure-catalog";
import { batchLoadAdventurePlayerStateByUser } from "@/lib/game/adventure-player-state";
import {
  loadApprovedReviewAggregatesByAdventureIds,
  reviewAggregateForAdventure,
} from "@/lib/game/adventure-review-aggregates";
import { batchLoadMyReviewByUserAndAdventureIds } from "@/lib/game/adventure-play-availability";
import {
  buildRestrictedAdventureWhereInput,
  restrictedAudienceLabel,
  sortRestrictedAdventureRows,
  type RestrictedAdventureAudienceLabel,
} from "@/lib/game/restricted-adventure-catalog-core";

const restrictedCatalogSelect = {
  ...publicCatalogSelect,
  audience: true,
} as const;

export type RestrictedCatalogAdventureRow = {
  audience: AdventureAudience;
} & PublicCatalogAdventureRow;

export type RestrictedMobileAdventureListItem = MobileAdventureListItem & {
  audience: RestrictedAdventureAudienceLabel;
};

/** Lignes Prisma démo/dev accessibles au compte (sans filtre catalogue ni distance). */
export async function fetchRestrictedCatalogRowsForViewer(params: {
  userId: string;
  role: string | null | undefined;
}): Promise<RestrictedCatalogAdventureRow[]> {
  const needDemoWhitelist = !isAdminRole(params.role);
  const needDevAssignments = isAdminRole(params.role) && !isSuperadmin(params.role);

  const [demoAccessRows, assignedRows] = await Promise.all([
    needDemoWhitelist
      ? prisma.adventureDemoAccess.findMany({
          where: { userId: params.userId },
          select: { adventureId: true },
        })
      : Promise.resolve([] as { adventureId: string }[]),
    needDevAssignments
      ? prisma.adminAdventureAccess.findMany({
          where: { userId: params.userId },
          select: { adventureId: true },
        })
      : Promise.resolve([] as { adventureId: string }[]),
  ]);

  const where = buildRestrictedAdventureWhereInput({
    role: params.role,
    demoWhitelistAdventureIds: demoAccessRows.map((r) => r.adventureId),
    assignedDevelopmentAdventureIds: assignedRows.map((r) => r.adventureId),
  });
  if (!where) {
    return [];
  }

  const rows = (await prisma.adventure.findMany({
    where,
    select: restrictedCatalogSelect,
  })) as RestrictedCatalogAdventureRow[];

  return sortRestrictedAdventureRows(
    rows.filter(
      (r): r is RestrictedCatalogAdventureRow =>
        r.audience === AdventureAudience.DEMO ||
        r.audience === AdventureAudience.DEVELOPMENT
    )
  );
}

/**
 * Parcours démo / développement accessibles au compte connecté (hors catalogue public).
 * Anonyme → toujours `[]` (ne pas appeler).
 */
export async function listRestrictedMobileAdventuresForViewer(params: {
  userId: string;
  role: string | null | undefined;
  latitude: number | null;
  longitude: number | null;
}): Promise<RestrictedMobileAdventureListItem[]> {
  const sorted = await fetchRestrictedCatalogRowsForViewer({
    userId: params.userId,
    role: params.role,
  });

  if (sorted.length === 0) {
    return [];
  }

  const withDistance = attachDistanceFromUser(
    sorted as PublicCatalogAdventureRow[],
    params.latitude,
    params.longitude
  );
  const ids = sorted.map((r) => r.id);
  const audienceById = new Map(sorted.map((r) => [r.id, r.audience]));

  const [reviewAggregates, playerStateByAdventureId, playAvailabilityById, myReviewById] =
    await Promise.all([
      loadApprovedReviewAggregatesByAdventureIds(ids),
      batchLoadAdventurePlayerStateByUser(
        params.userId,
        sorted.map((row) => catalogRowToPlayerStateBatchInput(row))
      ),
      buildPlayAvailabilityMapForCatalogRows(sorted),
      batchLoadMyReviewByUserAndAdventureIds(params.userId, ids),
    ]);

  return withDistance.map(({ row, distanceFromUserKm }) => ({
    ...toMobileAdventureListItem(
      row,
      distanceFromUserKm,
      reviewAggregateForAdventure(reviewAggregates, row.id),
      playAvailabilityById.get(row.id)!,
      playerStateByAdventureId.get(row.id),
      myReviewById.get(row.id)
    ),
    audience: restrictedAudienceLabel(audienceById.get(row.id)!),
  }));
}
