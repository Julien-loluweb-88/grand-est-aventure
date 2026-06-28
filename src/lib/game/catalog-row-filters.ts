export type CatalogRowFilterQuery = {
  cityId?: string;
  q?: string;
  hasTreasure?: boolean;
};

/** Filtre en mémoire (parcours restreints fusionnés au catalogue connecté). */
export function filterCatalogRowsByListQuery<
  T extends { row: { cityId: string; name: string; treasure: unknown | null } },
>(items: T[], query: CatalogRowFilterQuery): T[] {
  const q = query.q?.trim().toLowerCase();
  return items.filter(({ row }) => {
    if (query.cityId && row.cityId !== query.cityId) return false;
    if (q && !row.name.toLowerCase().includes(q)) return false;
    if (query.hasTreasure === true && !row.treasure) return false;
    if (query.hasTreasure === false && row.treasure) return false;
    return true;
  });
}
