import "server-only";

import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";
import type { AdventureAdminDetail } from "./adventure-queries";
import type { AdventureEditFormPayload } from "./adventure-edit-payload";
import { buildMapReferenceMarkers, type AdventureForMapReferences } from "./map-reference-markers";
import type { TreasureEditPayload } from "./treasure-edit-payload";

/** Clone JSON pour props client (RSC) sans références non sérialisables. */
export function cloneJsonForClient<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Repères carte prêts pour les composants client (énigmes / trésor). */
export function clientMapReferenceMarkersFromAdventure(adventure: AdventureForMapReferences): {
  all: LocationPickerContextMarker[];
  withoutTreasure: LocationPickerContextMarker[];
} {
  return {
    all: cloneJsonForClient(buildMapReferenceMarkers(adventure)),
    withoutTreasure: cloneJsonForClient(
      buildMapReferenceMarkers(adventure, { omitTreasure: true })
    ),
  };
}

/** JSON pur pour le formulaire client (évite références / objets non sérialisables côté RSC). */
export function adventurePayloadForEditForm(
  adventure: AdventureAdminDetail,
  routePolyline: [number, number][] | null
): AdventureEditFormPayload {
  const mapContextMarkers: AdventureEditFormPayload["mapContextMarkers"] = [
    ...adventure.enigmas.map((e) => ({
      kind: "enigma" as const,
      id: e.id,
      number: e.number,
      name: e.name,
      latitude: e.latitude,
      longitude: e.longitude,
    })),
  ];
  if (adventure.treasure) {
    mapContextMarkers.push({
      kind: "treasure",
      name: adventure.treasure.name,
      latitude: adventure.treasure.latitude,
      longitude: adventure.treasure.longitude,
    });
  }
  return JSON.parse(
    JSON.stringify({
      id: adventure.id,
      name: adventure.name,
      description: adventure.description,
      cityId: adventure.cityId,
      cityName: adventure.city.name,
      latitude: adventure.latitude,
      longitude: adventure.longitude,
      distance: adventure.distance,
      mapContextMarkers,
      routePolyline,
      coverImageUrl: adventure.coverImageUrl ?? null,
      badgeImageUrl: adventure.virtualBadge?.imageUrl ?? null,
      physicalBadgeStockCount: adventure.physicalBadgeStockCount ?? 0,
    })
  ) as AdventureEditFormPayload;
}

export function treasurePayloadForCard(
  treasure: NonNullable<AdventureAdminDetail["treasure"]>
): TreasureEditPayload {
  return JSON.parse(
    JSON.stringify({
      id: treasure.id,
      name: treasure.name,
      description: treasure.description,
      code: treasure.code,
      safeCode: treasure.safeCode,
      latitude: treasure.latitude,
      longitude: treasure.longitude,
      imageUrl: treasure.imageUrl ?? null,
    })
  ) as TreasureEditPayload;
}
