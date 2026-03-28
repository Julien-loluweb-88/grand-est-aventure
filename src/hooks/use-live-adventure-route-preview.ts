"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { previewAdventureRouteForAdmin } from "@/app/(authenticated)/admin-game/dashboard/aventures/[id]/_lib/preview-adventure-route.action";

function serializeWaypoints(wp: [number, number][]): string {
  return JSON.stringify(wp);
}

export type LiveRoutePreview = {
  distanceKm: number | null;
  polyline: [number, number][] | null;
};

/**
 * Après debounce, appelle ORS (aperçu) quand les waypoints changent.
 * Si `baselineSerialized` est fourni et égale au snapshot courant, l’aperçu est effacé (données serveur).
 */
export function useLiveAdventureRoutePreview(
  adventureId: string,
  waypoints: [number, number][],
  opts?: {
    debounceMs?: number;
    /** JSON.stringify(waypoints) pour revenir aux données enregistrées quand rien n’a changé. */
    baselineSerialized?: string | null;
    enabled?: boolean;
  }
): {
  liveRoute: LiveRoutePreview | null;
  /** `true` pendant la requête aperçu après debounce. */
  loading: boolean;
} {
  const debounceMs = opts?.debounceMs ?? 450;
  const enabled = opts?.enabled ?? true;
  const baselineSerialized = opts?.baselineSerialized;

  const wpKey = useMemo(() => serializeWaypoints(waypoints), [waypoints]);

  const [liveRoute, setLiveRoute] = useState<LiveRoutePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const requestSeqRef = useRef(0);
  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  useEffect(() => {
    if (!enabled) {
      requestSeqRef.current += 1;
      setLiveRoute(null);
      setLoading(false);
      return;
    }

    if (waypoints.length < 2) {
      requestSeqRef.current += 1;
      setLiveRoute(null);
      setLoading(false);
      return;
    }

    if (
      baselineSerialized != null &&
      baselineSerialized === serializeWaypoints(waypoints)
    ) {
      requestSeqRef.current += 1;
      setLiveRoute(null);
      setLoading(false);
      return;
    }

    const seq = ++requestSeqRef.current;
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        const result = await previewAdventureRouteForAdmin(
          adventureId,
          waypoints
        );
        if (seq !== requestSeqRef.current) {
          return;
        }
        setLoading(false);
        if (result.ok) {
          setLiveRoute({
            distanceKm: result.distanceKm,
            polyline: result.polyline,
          });
        } else {
          setLiveRoute({ distanceKm: null, polyline: null });
        }
      })();
    }, debounceMs);

    return () => {
      window.clearTimeout(t);
      requestSeqRef.current += 1;
    };
  }, [adventureId, baselineSerialized, debounceMs, enabled, wpKey]);

  return { liveRoute, loading };
}
