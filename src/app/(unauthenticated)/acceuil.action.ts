"use server"

import { prisma } from "@/lib/prisma";
import type { JsonValue } from "type-fest";

export async function getFiveStarReviews (rating: number ) {
    return await prisma.adventureReview.findMany({
        where: { rating },
            include: {
            user: true,
            },
        orderBy: {
            createdAt: "desc"
        }
    })
}

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

export async function getSampleAdventure(): Promise<AdventureWithMarkers | null> {
  const adventure = await prisma.adventure.findUnique({
    where: { id: "cmnfpciiz0001quy4l5rf0jjh" },
    include: { city: true },
  });

  if (!adventure) return null;

  const markers: LocationPickerContextMarker[] = [
    {
      kind: "departure",
      name: "Départ",
      latitude: adventure.latitude,
      longitude: adventure.longitude,
    }
  ];

  return {
    ...adventure,
    description: adventure.description as JsonValue,
    mapContextMarkers: markers,
    routePolyline: [],
  }   
  }

