"use server"

import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
import type { LocationPickerContextMarker as LocationPickerContextMarkerDef } from "@/components/location/location-picker-types";
import {
  reviewAggregateForAdventure,
  loadApprovedReviewAggregatesByAdventureIds,
} from "@/lib/game/adventure-review-aggregates";
import type { CommunityStats } from "@/lib/game/community-stats";
import { getCommunityStats } from "@/lib/game/community-stats";
import {
  buildPlayAvailabilityMapForCatalogRows,
  fetchPublicCatalogAdventures,
  selectFeaturedAdventures,
  toMobileAdventureListItem,
} from "@/lib/game/mobile-adventure-catalog";
import { formatDurationFr } from "@/lib/format-duration-fr";
import { tiptapStoredValueToPlainText } from "@/lib/adventure-description-tiptap";
import { UserAdventurePlaySessionStatus } from "@/lib/badges/prisma-enums";
import {
  AdventureAudience,
  AdventureReviewModerationStatus,
} from "../../../generated/prisma/client";

/** Alias réexporté pour les imports depuis ce module server (évite la perte des `export type { … } from`). */
export type LocationPickerContextMarker = LocationPickerContextMarkerDef;

export type AdventureWithMarkers = {
  id: string;
  name: string;
  description: unknown; 
  cityId: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  createdAt: Date;
  updatedAt: Date;
  coverImageUrl: string | null;
  physicalBadgeStockCount: number;
  status: boolean | null;
  creatorId: string;
  city: { id: string; name: string };
  /** Moyenne des notes (avis APPROVED avec note) ; `null` si aucun avis noté. */
  averageRating: number | null;
  mapContextMarkers: LocationPickerContextMarker[];
  routePolyline?: [number, number][];
};

export type HomeAdventurePreview = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  cityName: string;
  descriptionExcerpt: string;
  distanceKm: number | null;
  durationLabel: string;
  enigmaCount: number;
  hasTreasure: boolean;
  averageRating: number | null;
  reviewCount: number;
  completionCount: number;
};

export type HomeTerritoryCity = {
  id: string;
  name: string;
  adventureCount: number;
};

export type HomePageSnapshot = {
  mapAdventures: AdventureWithMarkers[];
  featuredAdventures: HomeAdventurePreview[];
  territoryCities: HomeTerritoryCity[];
  adventureCount: number;
  cityCount: number;
  catalogEnigmaCount: number;
  treasureCount: number;
  activePlayerCount: number;
  communityStats: CommunityStats;
  publishedReviewCount: number;
};

function truncateText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function adventureDurationLabel(
  estimatedSeconds: number | null | undefined,
  averageSeconds: number | null | undefined
): string {
  return formatDurationFr(averageSeconds ?? estimatedSeconds ?? null);
}

/** Données agrégées pour la page d’accueil (parcours, territoire, stats communauté). */
export async function getHomePageSnapshot(): Promise<HomePageSnapshot> {
  const [catalogRows, communityStats, mapAdventures, publishedReviewCount, activePlayerCount] =
    await Promise.all([
      fetchPublicCatalogAdventures(),
      getCommunityStats(),
      getSampleAdventures(),
      prisma.adventureReview.count({
        where: {
          moderationStatus: AdventureReviewModerationStatus.APPROVED,
          consentCommunicationNetworks: true,
          adventure: publicCatalogAdventureWhere,
        },
      }),
      prisma.user.count({
        where: {
          adventurePlaySessions: {
            some: { status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS },
          },
        },
      }),
    ]);

  const catalogEnigmaCount = catalogRows.reduce(
    (sum, row) => sum + row.enigmas.length,
    0
  );
  const treasureCount = catalogRows.filter((row) => row.treasure).length;

  const adventureIds = catalogRows.map((row) => row.id);
  const reviewAggregates =
    adventureIds.length === 0
      ? new Map()
      : await loadApprovedReviewAggregatesByAdventureIds(adventureIds);

  const playAvailabilityById =
    adventureIds.length === 0
      ? new Map()
      : await buildPlayAvailabilityMapForCatalogRows(catalogRows);

  const catalogItems = catalogRows.map((row) =>
    toMobileAdventureListItem(
      row,
      null,
      reviewAggregateForAdventure(reviewAggregates, row.id),
      playAvailabilityById.get(row.id)!
    )
  );

  const featuredItems = selectFeaturedAdventures(catalogItems, 6);
  const featuredIds = featuredItems.map((item) => item.id);

  const descriptionRows =
    featuredIds.length === 0
      ? []
      : await prisma.adventure.findMany({
          where: { id: { in: featuredIds } },
          select: { id: true, description: true },
        });
  const descriptionById = new Map(
    descriptionRows.map((row) => [row.id, row.description])
  );

  const cityMap = new Map<string, HomeTerritoryCity>();
  for (const row of catalogRows) {
    const existing = cityMap.get(row.cityId);
    if (existing) {
      existing.adventureCount += 1;
    } else {
      cityMap.set(row.cityId, {
        id: row.city.id,
        name: row.city.name,
        adventureCount: 1,
      });
    }
  }

  const territoryCities = [...cityMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  );

  const featuredAdventures: HomeAdventurePreview[] = featuredItems.map((item) => {
    const plain = tiptapStoredValueToPlainText(descriptionById.get(item.id));
    return {
      id: item.id,
      name: item.name,
      coverImageUrl: item.coverImageUrl,
      cityName: item.city.name,
      descriptionExcerpt: truncateText(plain, 140),
      distanceKm: item.distanceKm,
      durationLabel: adventureDurationLabel(
        item.estimatedDurationSeconds,
        item.averagePlayDurationSeconds
      ),
      enigmaCount: item.enigmaCount,
      hasTreasure: item.hasTreasure,
      averageRating: item.averageRating,
      reviewCount: item.reviewCount,
      completionCount: item.playDurationSampleCount,
    };
  });

  return {
    mapAdventures,
    featuredAdventures,
    territoryCities,
    adventureCount: catalogRows.length,
    cityCount: territoryCities.length,
    catalogEnigmaCount,
    treasureCount,
    activePlayerCount,
    communityStats,
    publishedReviewCount,
  };
}

/** Aventures affichées sur la carte d’accueil : catalogue public uniquement (jamais les démos). */
export async function getSampleAdventures(): Promise<AdventureWithMarkers[]> {
  const adventures = (
    await prisma.adventure.findMany({
      where: publicCatalogAdventureWhere,
      include: { city: true },
      orderBy: { name: "asc" },
    })
  ).filter((adv) => adv.audience === AdventureAudience.PUBLIC);

  const avgRows =
    adventures.length === 0
      ? []
      : await prisma.adventureReview.groupBy({
          by: ["adventureId"],
          where: {
            adventureId: { in: adventures.map((a) => a.id) },
            moderationStatus: AdventureReviewModerationStatus.APPROVED,
            rating: { not: null },
          },
          _avg: { rating: true },
        });

  const avgByAdventure = new Map(
    avgRows.map((r) => [r.adventureId, r._avg.rating])
  );

  return adventures.map((adv) => {
    const avg = avgByAdventure.get(adv.id);
    /* Marqueurs carte : `Adventure.latitude` / `longitude` = point de départ du parcours (schéma Prisma). */
    const markers: LocationPickerContextMarker[] = [
      {
        kind: "departure",
        name: adv.name,
        adventureId: adv.id,
        latitude: adv.latitude,
        longitude: adv.longitude,
        distanceKm: adv.distance,
        averageRating: avg ?? null,
        estimatedDurationSeconds: adv.estimatedPlayDurationSeconds ?? null,
        averagePlayDurationSeconds: adv.averagePlayDurationSeconds ?? null,
      },
    ];

    return {
      ...adv,
      description: adv.description,
      averageRating: avg ?? null,
      mapContextMarkers: markers,
      routePolyline: [],
    };
  });
}

  export async function getFiveStarReviews (rating: number) {
    return await prisma.adventureReview.findMany({
        where: {
          rating,
          consentCommunicationNetworks: true,
          moderationStatus: AdventureReviewModerationStatus.APPROVED,
          adventure: publicCatalogAdventureWhere,
        },
            include: {
            user: true,
            },
        orderBy: {
            createdAt: "desc"
        }
    })
}

