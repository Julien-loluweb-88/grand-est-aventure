"use server";

import { getUser } from "@/lib/auth/auth-user";
import { canManageAdventure, isAdminRole } from "@/lib/admin-access";
import { roleHasAdventurePermission } from "@/lib/permissions";
import {
  fetchOpenRouteServiceRouteAsLatLngPath,
  fetchOpenRouteServiceRouteDistanceKm,
} from "@/lib/openrouteservice";

const MAX_WAYPOINTS = 48;

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

function sanitizeWaypoints(
  raw: [number, number][]
): [number, number][] | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_WAYPOINTS) {
    return null;
  }
  for (const pair of raw) {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      typeof pair[0] !== "number" ||
      typeof pair[1] !== "number" ||
      !Number.isFinite(pair[0]) ||
      !Number.isFinite(pair[1])
    ) {
      return null;
    }
    const [lon, lat] = pair;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }
  }
  return dedupeConsecutiveLonLat(raw);
}

/**
 * Aperçu OpenRouteService (distance + polyline) sans écrire en base.
 * Pour recalcul en direct quand l’admin déplace un point sur la carte.
 */
export async function previewAdventureRouteForAdmin(
  adventureId: string,
  waypointsLonLat: [number, number][]
): Promise<
  | {
      ok: true;
      distanceKm: number | null;
      polyline: [number, number][] | null;
    }
  | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user || !isAdminRole(user.role)) {
    return { ok: false, error: "Non autorisé." };
  }
  if (!roleHasAdventurePermission(user.role, "update")) {
    return { ok: false, error: "Non autorisé." };
  }
  if (
    !(await canManageAdventure({
      userId: user.id,
      role: user.role,
      adventureId,
    }))
  ) {
    return { ok: false, error: "Non autorisé." };
  }

  const coords = sanitizeWaypoints(waypointsLonLat);
  if (!coords) {
    return {
      ok: true,
      distanceKm: null,
      polyline: null,
    };
  }

  try {
    const [distanceKm, polyline] = await Promise.all([
      fetchOpenRouteServiceRouteDistanceKm(coords),
      fetchOpenRouteServiceRouteAsLatLngPath(coords),
    ]);

    return {
      ok: true,
      distanceKm,
      polyline,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Impossible de calculer l’aperçu d’itinéraire pour le moment.",
    };
  }
}
