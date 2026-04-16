"use server"

import { prisma } from "@/lib/prisma";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
import type { LocationPickerContextMarker as LocationPickerContextMarkerDef } from "@/components/location/location-picker-types";
import { AdventureReviewModerationStatus } from "../../../generated/prisma/client";

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
  mapContextMarkers: LocationPickerContextMarker[];
  routePolyline?: [number, number][];
};

export async function getSampleAdventures(): Promise<AdventureWithMarkers[]> {
  const adventures = await prisma.adventure.findMany({
    where: publicCatalogAdventureWhere,
    include: { city: true },
  });

return adventures.map((adv) => {
    const markers: LocationPickerContextMarker[] = [
      {
        kind: "departure",
        name: "Départ",
        latitude: adv.latitude,
        longitude: adv.longitude,
      },
    ];

  return {
    ...adv,
    description: adv.description,
    mapContextMarkers: markers,
    routePolyline: [],
  }   
  })
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

