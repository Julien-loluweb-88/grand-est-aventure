import "server-only";

const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

/**
 * Distance totale d’un itinéraire via OpenRouteService (réseau routier / sentiers).
 * Coordonnées au format ORS : [longitude, latitude].
 * Retour en kilomètres, ou `null` si clé absente, erreur API ou pas assez de points valides.
 *
 * Variables d’environnement (serveur uniquement) :
 * - `OPENROUTESERVICE_API_KEY` : clé API
 * - `OPENROUTESERVICE_PROFILE` : optionnel, défaut `foot-walking` (ex. `cycling-regular`, `driving-car`)
 */
export async function fetchOpenRouteServiceRouteDistanceKm(
  coordinatesLonLat: [number, number][]
): Promise<number | null> {
  if (coordinatesLonLat.length < 2) {
    return null;
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const profile =
    process.env.OPENROUTESERVICE_PROFILE?.trim() || "foot-walking";

  const url = `${ORS_BASE}/${encodeURIComponent(profile)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ coordinates: coordinatesLonLat }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[openrouteservice]", res.status, text.slice(0, 300));
    return null;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }

  const routes =
    json &&
    typeof json === "object" &&
    "routes" in json &&
    Array.isArray((json as { routes: unknown }).routes)
      ? (json as { routes: unknown[] }).routes
      : null;
  if (!routes?.length) {
    return null;
  }

  const first = routes[0];
  const summary =
    first &&
    typeof first === "object" &&
    "summary" in first &&
    first.summary &&
    typeof first.summary === "object"
      ? (first.summary as { distance?: unknown })
      : null;
  const distanceM = summary?.distance;
  if (typeof distanceM !== "number" || !Number.isFinite(distanceM)) {
    return null;
  }

  return Math.round((distanceM / 1000) * 100) / 100;
}

const MAX_MAP_POLYLINE_POINTS = 750;

function downsampleLatLngPath(
  path: [number, number][],
  maxPoints: number
): [number, number][] {
  if (path.length <= maxPoints) {
    return path;
  }
  const out: [number, number][] = [];
  const last = path.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * last) / (maxPoints - 1));
    out.push(path[Math.min(idx, last)]!);
  }
  return out;
}

function collectLineCoordsFromGeoJsonGeometry(
  geometry: unknown,
  out: [number, number][]
): void {
  if (!geometry || typeof geometry !== "object" || !("type" in geometry)) {
    return;
  }
  const g = geometry as {
    type: string;
    coordinates?: unknown;
  };
  if (g.type === "LineString" && Array.isArray(g.coordinates)) {
    for (const c of g.coordinates) {
      if (
        Array.isArray(c) &&
        c.length >= 2 &&
        typeof c[0] === "number" &&
        typeof c[1] === "number"
      ) {
        out.push([c[1], c[0]]);
      }
    }
    return;
  }
  if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
    for (const line of g.coordinates) {
      if (!Array.isArray(line)) continue;
      for (const c of line) {
        if (
          Array.isArray(c) &&
          c.length >= 2 &&
          typeof c[0] === "number" &&
          typeof c[1] === "number"
        ) {
          out.push([c[1], c[0]]);
        }
      }
    }
  }
}

/**
 * Géométrie d’itinéraire « GPS » (réseau routier / sentiers) pour affichage carte : paires [lat, lng].
 * Même profil / clé que `fetchOpenRouteServiceRouteDistanceKm`. `null` si indisponible.
 */
export async function fetchOpenRouteServiceRouteAsLatLngPath(
  coordinatesLonLat: [number, number][]
): Promise<[number, number][] | null> {
  if (coordinatesLonLat.length < 2) {
    return null;
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const profile =
    process.env.OPENROUTESERVICE_PROFILE?.trim() || "foot-walking";

  const url = `${ORS_BASE}/${encodeURIComponent(profile)}/geojson`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/geo+json, application/json",
      },
      body: JSON.stringify({ coordinates: coordinatesLonLat }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[openrouteservice/geojson]", res.status, text.slice(0, 300));
    return null;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }

  const latLngs: [number, number][] = [];

  if (
    json &&
    typeof json === "object" &&
    "type" in json &&
    (json as { type: string }).type === "FeatureCollection" &&
    "features" in json &&
    Array.isArray((json as { features: unknown }).features)
  ) {
    for (const feat of (json as { features: unknown[] }).features) {
      if (
        feat &&
        typeof feat === "object" &&
        "geometry" in feat &&
        feat.geometry
      ) {
        collectLineCoordsFromGeoJsonGeometry(feat.geometry, latLngs);
      }
    }
  }

  if (latLngs.length < 2) {
    return null;
  }

  return downsampleLatLngPath(latLngs, MAX_MAP_POLYLINE_POINTS);
}
