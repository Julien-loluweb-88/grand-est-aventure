import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

export type AdventureForMapReferences = {
  latitude: number;
  longitude: number;
  enigmas: Array<{
    id: string;
    name: string;
    number: number;
    latitude: number;
    longitude: number;
  }>;
  treasure: { name: string; latitude: number; longitude: number } | null;
};

/**
 * Repères pour les cartes d’édition : départ (D) + énigmes + trésor.
 * `omitTreasure` : formulaire trésor (point actif = trésor).
 */
export function buildMapReferenceMarkers(
  adventure: AdventureForMapReferences,
  opts?: { omitTreasure?: boolean }
): LocationPickerContextMarker[] {
  const out: LocationPickerContextMarker[] = [
    {
      kind: "departure",
      latitude: adventure.latitude,
      longitude: adventure.longitude,
    },
  ];
  for (const e of adventure.enigmas) {
    out.push({
      kind: "enigma",
      id: e.id,
      number: e.number,
      name: e.name,
      latitude: e.latitude,
      longitude: e.longitude,
    });
  }
  if (adventure.treasure && !opts?.omitTreasure) {
    out.push({
      kind: "treasure",
      name: adventure.treasure.name,
      latitude: adventure.treasure.latitude,
      longitude: adventure.treasure.longitude,
    });
  }
  return out;
}
