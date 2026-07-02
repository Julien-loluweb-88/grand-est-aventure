import { describe, expect, it } from "vitest";
import { sortByDistanceFromUser } from "@/lib/game/sort-catalog-by-distance";

describe("sortByDistanceFromUser", () => {
  it("trie du plus proche au plus loin", () => {
    const sorted = sortByDistanceFromUser(
      [
        { id: "far", distanceFromUserKm: 50 },
        { id: "near", distanceFromUserKm: 1 },
      ],
      (i) => i.id
    );
    expect(sorted.map((s) => s.id)).toEqual(["near", "far"]);
  });

  it("ne réordonne pas sans GPS", () => {
    const input = [
      { id: "a", distanceFromUserKm: null },
      { id: "b", distanceFromUserKm: null },
    ];
    expect(sortByDistanceFromUser(input, (i) => i.id)).toBe(input);
  });
});
