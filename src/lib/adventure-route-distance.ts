import "server-only";

import { prisma } from "@/lib/prisma";
import {
  estimatePlayDurationSeconds,
  straightLinePathKmFromLonLat,
} from "@/lib/adventure-estimated-play-duration";
import {
  fetchOpenRouteServiceRouteAsLatLngPath,
  fetchOpenRouteServiceRouteDistanceKm,
} from "@/lib/openrouteservice";

function dedupeConsecutiveCoords(
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

type WaypointsResult =
  | { ok: false; reason: "not_found" | "too_few_points" }
  | { ok: true; coords: [number, number][] };

async function getAdventureWaypointsLonLat(
  adventureId: string
): Promise<WaypointsResult> {
  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      enigmas: {
        orderBy: { number: "asc" },
        select: { latitude: true, longitude: true },
      },
      treasure: { select: { latitude: true, longitude: true } },
    },
  });

  if (!adv) {
    return { ok: false, reason: "not_found" };
  }

  const raw: [number, number][] = [
    [adv.longitude, adv.latitude],
    ...adv.enigmas.map(
      (e) => [e.longitude, e.latitude] as [number, number]
    ),
  ];
  if (adv.treasure) {
    raw.push([adv.treasure.longitude, adv.treasure.latitude]);
  }

  const coords = dedupeConsecutiveCoords(raw);

  if (coords.length < 2) {
    return { ok: false, reason: "too_few_points" };
  }

  return { ok: true, coords };
}

/**
 * Recalcule la distance totale du parcours (départ → énigmes par `number` → trésor si présent)
 * et met à jour `Adventure.distance` (km) ou `null` si l’itinéraire n’est pas calculable.
 */
export async function syncAdventureRouteDistance(
  adventureId: string
): Promise<void> {
  const wp = await getAdventureWaypointsLonLat(adventureId);
  if (!wp.ok) {
    if (wp.reason === "too_few_points") {
      await prisma.adventure.update({
        where: { id: adventureId },
        data: { distance: null, estimatedPlayDurationSeconds: null },
      });
    }
    return;
  }

  const km = await fetchOpenRouteServiceRouteDistanceKm(wp.coords);
  const routeKm = km ?? straightLinePathKmFromLonLat(wp.coords);

  const counts = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      _count: { select: { enigmas: true } },
      treasure: { select: { id: true } },
    },
  });
  const enigmaCount = counts?._count.enigmas ?? 0;
  const hasTreasure = Boolean(counts?.treasure);
  const estimatedPlayDurationSeconds = estimatePlayDurationSeconds({
    routeKm,
    enigmaCount,
    hasTreasure,
  });

  await prisma.adventure.update({
    where: { id: adventureId },
    data: {
      distance: km,
      estimatedPlayDurationSeconds,
    },
  });
}

/**
 * Polyline [lat, lng][] suivant le même itinéraire ORS que la distance (pour carte admin).
 */
export async function getAdventureRoutePolylineForMap(
  adventureId: string
): Promise<[number, number][] | null> {
  const wp = await getAdventureWaypointsLonLat(adventureId);
  if (!wp.ok) {
    return null;
  }
  return fetchOpenRouteServiceRouteAsLatLngPath(wp.coords);
}
