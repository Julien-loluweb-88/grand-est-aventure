"use server"

import { prisma } from "@/lib/prisma";
import type { JsonValue } from "type-fest";
import { AdventureReviewModerationStatus } from "../../../generated/prisma/client"

type MapContextMarker = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type LocationPickerContextMarker = {
  kind: "departure" | "enigma" | "treasure";
  name: string;
  latitude: number;
  longitude: number;
};

export type AdventureWithMarkers = {
  id: string;
  name: string;
  description: JsonValue; 
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
    where: { status: true }
    ,
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
    description: adv.description as JsonValue,
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

