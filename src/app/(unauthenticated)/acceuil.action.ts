"use server"

import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
import type { LocationPickerContextMarker as LocationPickerContextMarkerDef } from "@/components/location/location-picker-types";
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
        where: { rating,
          consentCommunicationNetworks: true,
          moderationStatus: AdventureReviewModerationStatus.APPROVED
         },
            include: {
            user: true,
            },
        orderBy: {
            createdAt: "desc"
        }
    })
}

