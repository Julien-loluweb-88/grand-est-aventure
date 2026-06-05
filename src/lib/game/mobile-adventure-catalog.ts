import "server-only";

import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
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
import { haversineKm } from "@/lib/game/haversine";
import { sortByDistanceFromUser } from "@/lib/game/sort-catalog-by-distance";

const publicCatalogSelect = {
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

export async function fetchPublicCatalogAdventures() {
  return prisma.adventure.findMany({
    where: publicCatalogAdventureWhere,
    orderBy: [{ updatedAt: "desc" }],
    select: publicCatalogSelect,
  });
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
