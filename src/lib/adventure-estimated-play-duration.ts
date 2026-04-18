import { haversineMeters } from "@/lib/geo/haversine-meters";

/** Vitesse de marche supposée pour l’estimation (km/h). */
const ASSUMED_WALK_SPEED_KMH = 4;
/** Temps moyen par énigme (lecture + résolution), en secondes. */
const SECONDS_PER_ENIGMA = 4 * 60;
/** Marge phase trésor (carte + coffre), en secondes. */
const SECONDS_TREASURE_PHASE = 5 * 60;
const MIN_TOTAL_SECONDS = 5 * 60;
const MAX_TOTAL_SECONDS = 8 * 60 * 60;

/** Distance cumulée « à vol d’oiseau » entre waypoints ORS [lon, lat]. */
export function straightLinePathKmFromLonLat(coordsLonLat: [number, number][]): number {
  if (coordsLonLat.length < 2) {
    return 0;
  }
  let meters = 0;
  for (let i = 1; i < coordsLonLat.length; i++) {
    const [lon1, lat1] = coordsLonLat[i - 1];
    const [lon2, lat2] = coordsLonLat[i];
    meters += haversineMeters(lat1, lon1, lat2, lon2);
  }
  return meters / 1000;
}

/**
 * Heuristique durée de parcours (affichage / comparaison), indépendante des stats réelles joueurs.
 * Combine marche (distance / vitesse), temps par énigme et marge trésor si présent.
 */
export function estimatePlayDurationSeconds(params: {
  routeKm: number;
  enigmaCount: number;
  hasTreasure: boolean;
}): number {
  const walkSeconds = (Math.max(0, params.routeKm) / ASSUMED_WALK_SPEED_KMH) * 3600;
  const puzzleSeconds = Math.max(0, params.enigmaCount) * SECONDS_PER_ENIGMA;
  const treasureSeconds = params.hasTreasure ? SECONDS_TREASURE_PHASE : 0;
  const raw = walkSeconds + puzzleSeconds + treasureSeconds;
  return Math.min(MAX_TOTAL_SECONDS, Math.max(MIN_TOTAL_SECONDS, Math.round(raw)));
}
