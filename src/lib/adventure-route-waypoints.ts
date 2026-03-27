import type { LocationPickerContextMarker } from "@/components/location/location-picker-types";

function dedupeConsecutiveLonLat(
  coords: [number, number][]
): [number, number][] {
  const out: [number, number][] = [];
  for (const c of coords) {
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== c[0] || prev[1] !== c[1]) {
      out.push(c);
    }
  }
  return out;
}

export type BuildAdventureRouteWaypointsOptions = {
  /** Point de départ (formulaire modification aventure). */
  departure?: { latitude: number; longitude: number };
  /** Remplace une énigme existante (formulaire édition). */
  replaceEnigma?: {
    id: string;
    latitude: number;
    longitude: number;
    /** Si défini (champ numéro du formulaire), sert au tri du parcours. */
    number?: number;
  };
  /** Point d’énigme en création, inséré par numéro parmi les autres. */
  extraEnigma?: {
    number: number;
    latitude: number;
    longitude: number;
  };
  /**
   * Position du trésor (brouillon). Si défini, utilisée en dernier segment
   * (formulaires trésor où le marqueur T n’est pas dans les repères).
   * `undefined` : utiliser un marqueur trésor dans `markers` s’il existe.
   */
  treasurePosition?: { latitude: number; longitude: number } | null;
};

/**
 * Waypoints ORS [longitude, latitude], ordre : départ → énigmes (par numéro) → trésor.
 */
export function buildAdventureRouteWaypointsLonLat(
  markers: LocationPickerContextMarker[],
  options: BuildAdventureRouteWaypointsOptions = {}
): [number, number][] {
  const depMarker = markers.find((m) => m.kind === "departure");
  const depLat = options.departure?.latitude ?? depMarker?.latitude;
  const depLng = options.departure?.longitude ?? depMarker?.longitude;
  if (depLat == null || depLng == null) {
    return [];
  }

  type Bag = { number: number; lon: number; lat: number };
  const enigmaBags: Bag[] = [];

  for (const m of markers) {
    if (m.kind !== "enigma") continue;
    if (options.replaceEnigma?.id === m.id) {
      enigmaBags.push({
        number: options.replaceEnigma.number ?? m.number,
        lon: options.replaceEnigma.longitude,
        lat: options.replaceEnigma.latitude,
      });
    } else {
      enigmaBags.push({
        number: m.number,
        lon: m.longitude,
        lat: m.latitude,
      });
    }
  }

  if (options.extraEnigma) {
    enigmaBags.push({
      number: options.extraEnigma.number,
      lon: options.extraEnigma.longitude,
      lat: options.extraEnigma.latitude,
    });
  }

  enigmaBags.sort((a, b) => a.number - b.number);

  const raw: [number, number][] = [
    [depLng, depLat],
    ...enigmaBags.map((b) => [b.lon, b.lat] as [number, number]),
  ];

  let treasureLon: number | undefined;
  let treasureLat: number | undefined;
  if (options.treasurePosition != null) {
    treasureLon = options.treasurePosition.longitude;
    treasureLat = options.treasurePosition.latitude;
  } else {
    const tm = markers.find((m) => m.kind === "treasure");
    if (tm) {
      treasureLon = tm.longitude;
      treasureLat = tm.latitude;
    }
  }

  if (treasureLon != null && treasureLat != null) {
    raw.push([treasureLon, treasureLat]);
  }

  return dedupeConsecutiveLonLat(raw);
}
