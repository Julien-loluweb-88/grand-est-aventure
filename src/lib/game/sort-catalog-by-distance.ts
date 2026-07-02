export type WithDistanceFromUser = {
  distanceFromUserKm: number | null;
};

/** Du plus proche au plus loin si au moins une distance GPS est connue ; sinon ordre inchangé. */
export function sortByDistanceFromUser<T extends WithDistanceFromUser>(
  items: T[],
  nameOf: (item: T) => string
): T[] {
  if (!items.some((i) => i.distanceFromUserKm != null)) {
    return items;
  }
  return [...items].sort((a, b) => {
    const da = a.distanceFromUserKm;
    const db = b.distanceFromUserKm;
    if (da == null && db == null) {
      return nameOf(a).localeCompare(nameOf(b), "fr");
    }
    if (da == null) return 1;
    if (db == null) return -1;
    if (da !== db) return da - db;
    return nameOf(a).localeCompare(nameOf(b), "fr");
  });
}
