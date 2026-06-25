import type { Prisma } from "../../../generated/prisma/client";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";

export const CATALOG_SORT_VALUES = [
  "distance",
  "updated",
  "popular",
  "rating",
  "name",
] as const;

export type CatalogSort = (typeof CATALOG_SORT_VALUES)[number];

export type CatalogListQuery = {
  cityId?: string;
  q?: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number | null;
  hasTreasure?: boolean;
  sort: CatalogSort;
  limit: number;
  offset: number;
};

/** Filtres effectivement appliqués — renvoyé dans la réponse API pour l’app mobile. */
export type AppliedCatalogListFilters = {
  cityId: string | null;
  q: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number | null;
  hasTreasure: boolean | null;
  sort: CatalogSort;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseNumber(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseBooleanQuery(value: string | null): boolean | undefined {
  if (value == null || value.trim() === "") return undefined;
  const t = value.trim().toLowerCase();
  if (t === "true" || t === "1" || t === "yes") return true;
  if (t === "false" || t === "0" || t === "no") return false;
  return undefined;
}

export type ParseCatalogListQueryResult =
  | { ok: true; query: CatalogListQuery; applied: AppliedCatalogListFilters }
  | { ok: false; error: string; status: 400 };

export function parseCatalogListQuery(
  params: URLSearchParams,
  options?: { defaultLimit?: number; maxLimit?: number }
): ParseCatalogListQueryResult {
  const defaultLimit = options?.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options?.maxLimit ?? MAX_LIMIT;

  const cityId = (params.get("cityId") ?? "").trim() || undefined;
  const q = (params.get("q") ?? "").trim() || undefined;
  const latitude = parseNumber(params.get("latitude"));
  const longitude = parseNumber(params.get("longitude"));
  const radiusKm = parseNumber(params.get("radiusKm"));
  const hasTreasure = parseBooleanQuery(params.get("hasTreasure"));

  const sortRaw = (params.get("sort") ?? "").trim().toLowerCase();
  let sort: CatalogSort = "updated";
  if (sortRaw) {
    if (!CATALOG_SORT_VALUES.includes(sortRaw as CatalogSort)) {
      return {
        ok: false,
        status: 400,
        error: `sort invalide. Valeurs : ${CATALOG_SORT_VALUES.join(", ")}.`,
      };
    }
    sort = sortRaw as CatalogSort;
  } else if (latitude != null && longitude != null) {
    sort = "distance";
  }

  const limitRaw = parseNumber(params.get("limit"));
  const offsetRaw = parseNumber(params.get("offset"));
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isInteger(limitRaw) ? (limitRaw as number) : defaultLimit)
  );
  const offset = Math.max(0, Number.isInteger(offsetRaw) ? (offsetRaw as number) : 0);

  if ((latitude == null) !== (longitude == null)) {
    return {
      ok: false,
      status: 400,
      error: "latitude et longitude doivent être fournies ensemble.",
    };
  }
  if (radiusKm != null && (latitude == null || longitude == null)) {
    return {
      ok: false,
      status: 400,
      error: "radiusKm nécessite latitude et longitude.",
    };
  }
  if (radiusKm != null && radiusKm <= 0) {
    return { ok: false, status: 400, error: "radiusKm doit être > 0." };
  }
  if (sort === "distance" && (latitude == null || longitude == null)) {
    return {
      ok: false,
      status: 400,
      error: "sort=distance nécessite latitude et longitude.",
    };
  }

  const query: CatalogListQuery = {
    cityId,
    q,
    latitude,
    longitude,
    radiusKm,
    hasTreasure,
    sort,
    limit,
    offset,
  };

  return {
    ok: true,
    query,
    applied: {
      cityId: cityId ?? null,
      q: q ?? null,
      latitude,
      longitude,
      radiusKm,
      hasTreasure: hasTreasure ?? null,
      sort,
    },
  };
}

export function catalogAdventureWhereFromQuery(
  query: Pick<CatalogListQuery, "cityId" | "q" | "hasTreasure">
): Prisma.AdventureWhereInput {
  return {
    ...publicCatalogAdventureWhere,
    ...(query.cityId ? { cityId: query.cityId } : {}),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
    ...(query.hasTreasure === true ? { treasure: { isNot: null } } : {}),
    ...(query.hasTreasure === false ? { treasure: null } : {}),
  };
}
