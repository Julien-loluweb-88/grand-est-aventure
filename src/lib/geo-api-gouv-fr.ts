/**
 * API géographique de l’État — https://geo.api.gouv.fr (communes, INSEE, coordonnées).
 * Utilisable côté client (fetch direct) ou serveur.
 */

const GEO_API_BASE = "https://geo.api.gouv.fr";

export type GeoCommuneDto = {
  inseeCode: string;
  name: string;
  postalCodes: string[];
  latitude: number;
  longitude: number;
  population: number | null;
};

type ApiCommune = {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  centre?: { type?: string; coordinates?: [number, number] };
  mairie?: { type?: string; coordinates?: [number, number] };
  population?: number;
};

const COMMUNE_FIELDS =
  "nom,code,codesPostaux,centre,mairie,population";

function parseCommune(raw: unknown): GeoCommuneDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as ApiCommune;
  const code = typeof o.code === "string" ? o.code.trim() : "";
  const name = typeof o.nom === "string" ? o.nom.trim() : "";
  const geom = o.centre ?? o.mairie;
  const coords = geom?.coordinates;
  if (!/^\d{5}$/.test(code) || !name || !Array.isArray(coords) || coords.length < 2) {
    return null;
  }
  const [lon, lat] = coords;
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  const postalCodes = Array.isArray(o.codesPostaux)
    ? o.codesPostaux.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const pop =
    typeof o.population === "number" && Number.isFinite(o.population)
      ? Math.round(o.population)
      : null;
  return {
    inseeCode: code,
    name,
    postalCodes,
    latitude: lat,
    longitude: lon,
    population: pop,
  };
}

export async function fetchCommunesByNameFromGeoApi(
  nom: string,
  signal?: AbortSignal
): Promise<GeoCommuneDto[]> {
  const q = nom.trim();
  if (q.length < 2) return [];

  const url = new URL(`${GEO_API_BASE}/communes`);
  url.searchParams.set("nom", q.slice(0, 80));
  url.searchParams.set("boost", "population");
  url.searchParams.set("limit", "15");
  url.searchParams.set("fields", COMMUNE_FIELDS);

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  const out: GeoCommuneDto[] = [];
  for (const item of data) {
    const parsed = parseCommune(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

export async function fetchCommuneByInseeFromGeoApi(
  inseeCode: string,
  signal?: AbortSignal
): Promise<GeoCommuneDto | null> {
  const code = inseeCode.trim();
  if (!/^\d{5}$/.test(code)) return null;

  const fetchOpts = {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store" as const,
  };

  const urls = [
    `${GEO_API_BASE}/communes/${encodeURIComponent(code)}?fields=${encodeURIComponent(COMMUNE_FIELDS)}`,
    `${GEO_API_BASE}/communes/${encodeURIComponent(code)}`,
  ];

  for (const url of urls) {
    const res = await fetch(url, fetchOpts);
    if (res.status === 404) return null;
    if (!res.ok) continue;
    const data: unknown = await res.json();
    const parsed = parseCommune(data);
    if (parsed) return parsed;
  }

  return null;
}
