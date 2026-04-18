import { describe, expect, it } from "vitest";
import {
  estimatePlayDurationSeconds,
  straightLinePathKmFromLonLat,
} from "./adventure-estimated-play-duration";

describe("estimatePlayDurationSeconds", () => {
  it("applique le plancher 5 min sans parcours ni énigmes", () => {
    expect(estimatePlayDurationSeconds({ routeKm: 0, enigmaCount: 0, hasTreasure: false })).toBe(
      5 * 60
    );
  });

  it("ajoute 4 min par énigme et 5 min trésor", () => {
    expect(estimatePlayDurationSeconds({ routeKm: 0, enigmaCount: 2, hasTreasure: true })).toBe(
      2 * 4 * 60 + 5 * 60
    );
  });

  it("marche : 4 km à 4 km/h = 1 h de marche seul", () => {
    expect(estimatePlayDurationSeconds({ routeKm: 4, enigmaCount: 0, hasTreasure: false })).toBe(
      3600
    );
  });

  it("borne à 8 h maximum", () => {
    expect(
      estimatePlayDurationSeconds({ routeKm: 500, enigmaCount: 200, hasTreasure: true })
    ).toBe(8 * 60 * 60);
  });
});

describe("straightLinePathKmFromLonLat", () => {
  it("retourne 0 pour moins de 2 points", () => {
    expect(straightLinePathKmFromLonLat([[5.1, 48.6]])).toBe(0);
  });

  it("somme deux segments proches", () => {
    const a: [number, number] = [5.1, 48.6];
    const b: [number, number] = [5.11, 48.61];
    const c: [number, number] = [5.12, 48.62];
    const km = straightLinePathKmFromLonLat([a, b, c]);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
  });
});
