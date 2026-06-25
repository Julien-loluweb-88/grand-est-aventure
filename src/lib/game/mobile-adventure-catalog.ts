import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdventurePlayerState } from "@/lib/game/adventure-player-state";
import type { AdventureReviewAggregate } from "@/lib/game/adventure-review-aggregates";
import type {
  AdventureMyReviewSnapshot,
  AdventurePlayAvailability,
} from "@/lib/game/adventure-play-availability-core";
import {
  batchBuildPlayAvailabilityByAdventureIds,
  playAvailabilitySourceFromCatalogRow,
} from "@/lib/game/adventure-play-availability";
import type { CatalogListQuery, CatalogSort } from "@/lib/game/catalog-list-query";
import { catalogAdventureWhereFromQuery } from "@/lib/game/catalog-list-query";
import { loadApprovedReviewAggregatesByAdventureIds } from "@/lib/game/adventure-review-aggregates";
import { haversineKm } from "@/lib/game/haversine";
import { sortByDistanceFromUser } from "@/lib/game/sort-catalog-by-distance";

export const publicCatalogSelect = {
  id: true,
  name: true,
  cityId: true,
  latitude: true,
  longitude: true,
  distance: true,
  estimatedPlayDurationSeconds: true,
  averagePlayDurationSeconds: true,
  playDurationSampleCount: true,
  coverImageUrl: true,
  updatedAt: true,
  physicalBadgeStockCount: true,
  treasureUnavailable: true,
  treasureUnavailableMessage: true,
  treasureUnavailableUpdatedAt: true,
  physicalBadgesUnavailable: true,
  physicalBadgesUnavailableMessage: true,
  physicalBadgesUnavailableUpdatedAt: true,
  city: {
    select: {
      id: true,
      name: true,
      postalCodes: true,
    },
  },
  enigmas: { select: { id: true, number: true } },
  treasure: { select: { id: true } },
} as const;

export type PublicCatalogAdventureRow = Awaited<
  ReturnType<typeof fetchPublicCatalogAdventures>
>[number];

export async function fetchFilteredPublicCatalogAdventures(
  query: Pick<CatalogListQuery, "cityId" | "q" | "hasTreasure">
) {
  return prisma.adventure.findMany({
    where: catalogAdventureWhereFromQuery(query),
    orderBy: [{ updatedAt: "desc" }],
    select: publicCatalogSelect,
  });
}

export async function fetchPublicCatalogAdventures() {
  return fetchFilteredPublicCatalogAdventures({});
}

export type MobileAdventureListItem = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  city: { id: string; name: string; postalCodes: string[] };
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  distanceFromUserKm: number | null;
  enigmaCount: number;
  hasTreasure: boolean;
  playAvailability: AdventurePlayAvailability;
  estimatedDurationSeconds: number | null;
  averagePlayDurationSeconds: number | null;
  playDurationSampleCount: number;
  averageRating: number | null;
  reviewCount: number;
  updatedAt: string;
  playerState?: AdventurePlayerState;
  myReview?: AdventureMyReviewSnapshot;
};

export function catalogRowToPlayerStateBatchInput(
  row: PublicCatalogAdventureRow
): {
  adventureId: string;
  requiredEnigmaNumbers: number[];
  hasTreasure: boolean;
} {
  return {
    adventureId: row.id,
    requiredEnigmaNumbers: row.enigmas.map((e) => e.number).sort((a, b) => a - b),
    hasTreasure: Boolean(row.treasure),
  };
}

export function toMobileAdventureListItem(
  a: PublicCatalogAdventureRow,
  distanceFromUserKm: number | null,
  reviewStats: AdventureReviewAggregate = { averageRating: null, reviewCount: 0 },
  playAvailability: AdventurePlayAvailability,
  playerState?: AdventurePlayerState,
  myReview?: AdventureMyReviewSnapshot
): MobileAdventureListItem {
  return {
    id: a.id,
    name: a.name,
    coverImageUrl: a.coverImageUrl,
    city: a.city,
    latitude: a.latitude,
    longitude: a.longitude,
    distanceKm: a.distance,
    distanceFromUserKm,
    enigmaCount: a.enigmas.length,
    hasTreasure: Boolean(a.treasure),
    playAvailability,
    estimatedDurationSeconds: a.estimatedPlayDurationSeconds,
    averagePlayDurationSeconds: a.averagePlayDurationSeconds,
    playDurationSampleCount: a.playDurationSampleCount,
    averageRating: reviewStats.reviewCount > 0 ? reviewStats.averageRating : null,
    reviewCount: reviewStats.reviewCount,
    updatedAt: a.updatedAt.toISOString(),
    ...(playerState ? { playerState } : {}),
    ...(myReview ? { myReview } : {}),
  };
}

export async function buildPlayAvailabilityMapForCatalogRows(
  rows: PublicCatalogAdventureRow[]
): Promise<Map<string, AdventurePlayAvailability>> {
  return batchBuildPlayAvailabilityByAdventureIds(
    rows.map((row) => ({
      adventureId: row.id,
      source: playAvailabilitySourceFromCatalogRow(row),
    }))
  );
}

export type CatalogRowWithUserDistance = {
  row: PublicCatalogAdventureRow;
  distanceFromUserKm: number | null;
};

export function attachDistanceFromUser(
  adventures: PublicCatalogAdventureRow[],
  latitude: number | null,
  longitude: number | null
): CatalogRowWithUserDistance[] {
  return adventures.map((row) => ({
    row,
    distanceFromUserKm:
      latitude != null && longitude != null
        ? haversineKm(latitude, longitude, row.latitude, row.longitude)
        : null,
  }));
}

export function sortCatalogRowsByDistanceFromUser(
  items: CatalogRowWithUserDistance[]
): CatalogRowWithUserDistance[] {
  return sortByDistanceFromUser(items, (i) => i.row.name);
}

export function filterCatalogRowsByRadiusKm(
  items: CatalogRowWithUserDistance[],
  radiusKm: number | null
): CatalogRowWithUserDistance[] {
  if (radiusKm == null) return items;
  return items.filter(
    ({ distanceFromUserKm }) => (distanceFromUserKm ?? Infinity) <= radiusKm
  );
}

export function sortCatalogRows(
  items: CatalogRowWithUserDistance[],
  sort: CatalogSort,
  ratingByAdventureId?: Map<string, AdventureReviewAggregate>
): CatalogRowWithUserDistance[] {
  const copy = [...items];
  switch (sort) {
    case "distance":
      return sortCatalogRowsByDistanceFromUser(copy);
    case "name":
      copy.sort((a, b) => a.row.name.localeCompare(b.row.name, "fr"));
      return copy;
    case "popular":
      copy.sort((a, b) => {
        const d = b.row.playDurationSampleCount - a.row.playDurationSampleCount;
        return d !== 0 ? d : a.row.name.localeCompare(b.row.name, "fr");
      });
      return copy;
    case "rating": {
      const ratings = ratingByAdventureId ?? new Map();
      copy.sort((a, b) => {
        const ra = ratings.get(a.row.id)?.averageRating;
        const rb = ratings.get(b.row.id)?.averageRating;
        const ca = ratings.get(a.row.id)?.reviewCount ?? 0;
        const cb = ratings.get(b.row.id)?.reviewCount ?? 0;
        const va = ra != null && ca > 0 ? ra : -1;
        const vb = rb != null && cb > 0 ? rb : -1;
        if (vb !== va) return vb - va;
        return a.row.name.localeCompare(b.row.name, "fr");
      });
      return copy;
    }
    case "updated":
    default:
      copy.sort((a, b) => {
        const t = b.row.updatedAt.getTime() - a.row.updatedAt.getTime();
        return t !== 0 ? t : a.row.name.localeCompare(b.row.name, "fr");
      });
      return copy;
  }
}

export async function queryPublicCatalogAdventureList(
  query: CatalogListQuery
): Promise<{
  total: number;
  rows: CatalogRowWithUserDistance[];
}> {
  const adventures = await fetchFilteredPublicCatalogAdventures(query);
  const withDistance = attachDistanceFromUser(
    adventures,
    query.latitude,
    query.longitude
  );
  const radiusFiltered = filterCatalogRowsByRadiusKm(withDistance, query.radiusKm);

  let ratingMap: Map<string, AdventureReviewAggregate> | undefined;
  if (query.sort === "rating") {
    ratingMap = await loadApprovedReviewAggregatesByAdventureIds(
      radiusFiltered.map(({ row }) => row.id)
    );
  }

  const sorted = sortCatalogRows(radiusFiltered, query.sort, ratingMap);
  return { total: sorted.length, rows: sorted };
}

export function sortAdventureListItemsByDistanceFromUser(
  items: MobileAdventureListItem[]
): MobileAdventureListItem[] {
  return sortByDistanceFromUser(items, (i) => i.name);
}

/**
 * Carrousel « populaires » : score = completionCount / (1 + distanceFromUserKm).
 * `completionCount` = `Adventure.playDurationSampleCount` (sessions terminées avec succès, alimenté par le cron).
 * Sans GPS : tri par `completionCount` décroissant uniquement.
 */
export function selectFeaturedAdventures(
  items: MobileAdventureListItem[],
  limit: number
): MobileAdventureListItem[] {
  const capped = Math.max(1, Math.min(10, limit));

  const scored = items.map((item) => {
    const completionCount = item.playDurationSampleCount;
    const distance = item.distanceFromUserKm;
    const score =
      distance != null ? completionCount / (1 + distance) : completionCount;
    return { item, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name.localeCompare(b.item.name, "fr");
  });

  return scored.slice(0, capped).map((s) => s.item);
}
