import { describe, expect, it } from "vitest";
import { filterCatalogRowsByListQuery } from "./catalog-row-filters";

describe("filterCatalogRowsByListQuery", () => {
  const items = [
    {
      row: {
        id: "a",
        name: "Ballade Toulouse",
        cityId: "c1",
        treasure: { id: "t" },
      },
    },
    {
      row: {
        id: "b",
        name: "Test Raon",
        cityId: "c2",
        treasure: null,
      },
    },
  ];

  it("filtre par ville", () => {
    const filtered = filterCatalogRowsByListQuery(items, { cityId: "c1" });
    expect(filtered.map((i) => i.row.id)).toEqual(["a"]);
  });

  it("filtre par recherche nom", () => {
    const filtered = filterCatalogRowsByListQuery(items, { q: "toulouse" });
    expect(filtered.map((i) => i.row.id)).toEqual(["a"]);
  });

  it("filtre par trésor", () => {
    const withTreasure = filterCatalogRowsByListQuery(items, { hasTreasure: true });
    expect(withTreasure.map((i) => i.row.id)).toEqual(["a"]);

    const withoutTreasure = filterCatalogRowsByListQuery(items, { hasTreasure: false });
    expect(withoutTreasure.map((i) => i.row.id)).toEqual(["b"]);
  });
});
