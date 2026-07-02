import "server-only";

import { prisma } from "@/lib/prisma";
import { fetchCommuneAtCoordinatesFromGeoApi } from "@/lib/geo-api-gouv-fr";
import { haversineMeters } from "@/lib/geo/haversine-meters";

/** Distance max (m) pour le repli « ville la plus proche » du référentiel. */
const NEAREST_CITY_MAX_METERS = 15_000;

/** Cache mémoire lat/lon arrondies → ville (évite Gouv + SQL à chaque /home). */
const RESOLVE_CACHE_TTL_MS = 15 * 60 * 1000;

export type CityResolveSource = "insee" | "nearest";

export type ResolvedCityFromCoordinates = {
  cityId: string;
  cityName: string;
  source: CityResolveSource;
};

type CacheEntry = { value: ResolvedCityFromCoordinates | null; expiresAt: number };

let resolveCache = new Map<string, CacheEntry>();
let nearestCitiesCache: {
  rows: { id: string; name: string; latitude: number; longitude: number }[];
  expiresAt: number;
} | null = null;

const NEAREST_CITIES_CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

async function loadCitiesWithCoordinates() {
  const now = Date.now();
  if (nearestCitiesCache && now < nearestCitiesCache.expiresAt) {
    return nearestCitiesCache.rows;
  }

  const rows = await prisma.city.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  const withCoords = rows.filter(
    (c): c is typeof c & { latitude: number; longitude: number } =>
      c.latitude != null && c.longitude != null
  );

  nearestCitiesCache = {
    rows: withCoords,
    expiresAt: now + NEAREST_CITIES_CACHE_TTL_MS,
  };
  return withCoords;
}

async function resolveNearestCityInCatalog(
  latitude: number,
  longitude: number
): Promise<ResolvedCityFromCoordinates | null> {
  const cities = await loadCitiesWithCoordinates();
  if (cities.length === 0) {
    return null;
  }

  let best: { id: string; name: string; distanceM: number } | null = null;

  for (const city of cities) {
    const distanceM = haversineMeters(latitude, longitude, city.latitude, city.longitude);
    if (distanceM > NEAREST_CITY_MAX_METERS) {
      continue;
    }
    if (!best || distanceM < best.distanceM) {
      best = { id: city.id, name: city.name, distanceM };
    }
  }

  if (!best) {
    return null;
  }

  return {
    cityId: best.id,
    cityName: best.name,
    source: "nearest",
  };
}

async function resolveCityFromCoordinatesUncached(
  latitude: number,
  longitude: number
): Promise<ResolvedCityFromCoordinates | null> {
  const commune = await fetchCommuneAtCoordinatesFromGeoApi(latitude, longitude);
  if (commune) {
    const byInsee = await prisma.city.findFirst({
      where: { inseeCode: commune.inseeCode },
      select: { id: true, name: true },
    });
    if (byInsee) {
      return {
        cityId: byInsee.id,
        cityName: byInsee.name,
        source: "insee",
      };
    }
  }

  return resolveNearestCityInCatalog(latitude, longitude);
}

/**
 * Infère une ville du référentiel jeu à partir du GPS :
 * 1. API Gouv (commune au point) → match `City.inseeCode`
 * 2. Repli : ville catalogue la plus proche (≤ 15 km)
 */
export async function resolveCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<ResolvedCityFromCoordinates | null> {
  const key = cacheKey(latitude, longitude);
  const now = Date.now();
  const hit = resolveCache.get(key);
  if (hit && now < hit.expiresAt) {
    return hit.value;
  }

  const value = await resolveCityFromCoordinatesUncached(latitude, longitude);
  resolveCache.set(key, { value, expiresAt: now + RESOLVE_CACHE_TTL_MS });

  if (resolveCache.size > 500) {
    resolveCache = new Map(
      [...resolveCache.entries()].filter(([, entry]) => entry.expiresAt > now)
    );
  }

  return value;
}
