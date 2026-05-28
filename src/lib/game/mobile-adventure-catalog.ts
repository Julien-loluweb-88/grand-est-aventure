import "server-only";

import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
import type { AdventureReviewAggregate } from "@/lib/game/adventure-review-aggregates";
import { haversineKm } from "@/lib/game/haversine";

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
  city: {
    select: {
      id: true,
      name: true,
      postalCodes: true,
    },
  },
  enigmas: { select: { id: true } },
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
  estimatedDurationSeconds: number | null;
  averagePlayDurationSeconds: number | null;
  playDurationSampleCount: number;
  averageRating: number | null;
  reviewCount: number;
  updatedAt: string;
};

export function toMobileAdventureListItem(
  a: PublicCatalogAdventureRow,
  distanceFromUserKm: number | null,
  reviewStats: AdventureReviewAggregate = { averageRating: null, reviewCount: 0 }
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
    estimatedDurationSeconds: a.estimatedPlayDurationSeconds,
    averagePlayDurationSeconds: a.averagePlayDurationSeconds,
    playDurationSampleCount: a.playDurationSampleCount,
    averageRating: reviewStats.reviewCount > 0 ? reviewStats.averageRating : null,
    reviewCount: reviewStats.reviewCount,
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function attachDistanceFromUser(
  adventures: PublicCatalogAdventureRow[],
  latitude: number | null,
  longitude: number | null
): { row: PublicCatalogAdventureRow; distanceFromUserKm: number | null }[] {
  return adventures.map((row) => ({
    row,
    distanceFromUserKm:
      latitude != null && longitude != null
        ? haversineKm(latitude, longitude, row.latitude, row.longitude)
        : null,
  }));
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
