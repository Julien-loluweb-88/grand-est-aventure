import "server-only";

import type { CatalogListQuery } from "@/lib/game/catalog-list-query";
import { filterCatalogRowsByListQuery } from "@/lib/game/catalog-row-filters";
import type { AdventureReviewAggregate } from "@/lib/game/adventure-review-aggregates";
import { loadApprovedReviewAggregatesByAdventureIds } from "@/lib/game/adventure-review-aggregates";
import {
  attachDistanceFromUser,
  filterCatalogRowsByRadiusKm,
  queryPublicCatalogAdventureList,
  sortCatalogRows,
  type CatalogRowWithUserDistance,
} from "@/lib/game/mobile-adventure-catalog";
import {
  fetchRestrictedCatalogRowsForViewer,
  type RestrictedCatalogAdventureRow,
} from "@/lib/game/restricted-adventure-catalog";
import {
  restrictedAudienceLabel,
  type RestrictedAdventureAudienceLabel,
} from "@/lib/game/restricted-adventure-catalog-core";

export type MobileCatalogRowWithUserDistance = CatalogRowWithUserDistance & {
  /** Présent uniquement pour les parcours démo/dev inclus dans la liste connectée. */
  restrictedAudience?: RestrictedAdventureAudienceLabel;
};

function restrictedRowsToCatalogItems(
  rows: RestrictedCatalogAdventureRow[],
  latitude: number | null,
  longitude: number | null
): MobileCatalogRowWithUserDistance[] {
  const audienceById = new Map(rows.map((r) => [r.id, r.audience]));
  return attachDistanceFromUser(rows, latitude, longitude).map(({ row, distanceFromUserKm }) => ({
    row,
    distanceFromUserKm,
    restrictedAudience: restrictedAudienceLabel(audienceById.get(row.id)!),
  }));
}

function mergeCatalogRows(
  publicRows: CatalogRowWithUserDistance[],
  restrictedRows: MobileCatalogRowWithUserDistance[]
): MobileCatalogRowWithUserDistance[] {
  const publicIds = new Set(publicRows.map(({ row }) => row.id));
  const extraRestricted = restrictedRows.filter(({ row }) => !publicIds.has(row.id));
  return [...publicRows, ...extraRestricted];
}

/**
 * Catalogue mobile : PUBLIC + parcours démo/dev accessibles au compte connecté.
 * Filtres, tri et pagination appliqués sur l’ensemble fusionné.
 */
export async function queryMobileAdventureCatalogList(
  query: CatalogListQuery,
  viewer?: { userId: string; role: string | null | undefined }
): Promise<{ total: number; rows: MobileCatalogRowWithUserDistance[] }> {
  const { rows: publicRows } = await queryPublicCatalogAdventureList(query);

  if (!viewer) {
    return { total: publicRows.length, rows: publicRows };
  }

  const restrictedSource = await fetchRestrictedCatalogRowsForViewer(viewer);
  if (restrictedSource.length === 0) {
    return { total: publicRows.length, rows: publicRows };
  }

  const restrictedWithDistance = restrictedRowsToCatalogItems(
    restrictedSource,
    query.latitude,
    query.longitude
  );
  const restrictedFiltered = filterCatalogRowsByRadiusKm(
    filterCatalogRowsByListQuery(restrictedWithDistance, query),
    query.radiusKm
  );

  const merged = mergeCatalogRows(publicRows, restrictedFiltered);
  if (merged.length === publicRows.length) {
    return { total: publicRows.length, rows: publicRows };
  }

  let ratingMap: Map<string, AdventureReviewAggregate> | undefined;
  if (query.sort === "rating") {
    ratingMap = await loadApprovedReviewAggregatesByAdventureIds(
      merged.map(({ row }) => row.id)
    );
  }

  const sorted = sortCatalogRows(merged, query.sort, ratingMap);
  return { total: sorted.length, rows: sorted };
}
