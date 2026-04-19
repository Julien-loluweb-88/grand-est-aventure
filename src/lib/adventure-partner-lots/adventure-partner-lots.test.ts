import { describe, expect, it } from "vitest";
import {
  lotIsEligibleNow,
  toPublicWin,
  weightedRandomLot,
} from "./adventure-partner-lots-logic";

describe("weightedRandomLot", () => {
  it("returns null for empty pool", () => {
    expect(weightedRandomLot([])).toBeNull();
  });

  it("returns the only element", () => {
    expect(weightedRandomLot([{ id: "a", weight: 3 }])).toEqual({
      id: "a",
      weight: 3,
    });
  });
});

describe("toPublicWin", () => {
  it("expose validUntil et redeemed", () => {
    const lot = {
      id: "lot1",
      partnerName: "Café",
      title: "-10 %",
      description: null,
      redemptionHint: "En caisse",
      weight: 1,
      quantityRemaining: null,
      active: true,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validUntil: new Date("2026-12-31T23:59:59.999Z"),
      adventureId: "a1",
      cityId: null,
    };
    const w = toPublicWin(lot, { winId: "w1", redeemedAt: null });
    expect(w.winId).toBe("w1");
    expect(w.validUntil).toBe("2026-12-31T23:59:59.999Z");
    expect(w.redeemed).toBe(false);
  });
});

describe("lotIsEligibleNow", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");

  it("rejects inactive", () => {
    expect(
      lotIsEligibleNow(
        {
          active: false,
          validFrom: null,
          validUntil: null,
          quantityRemaining: null,
          weight: 1,
        },
        now
      )
    ).toBe(false);
  });

  it("accepts unlimited stock", () => {
    expect(
      lotIsEligibleNow(
        {
          active: true,
          validFrom: null,
          validUntil: null,
          quantityRemaining: null,
          weight: 2,
        },
        now
      )
    ).toBe(true);
  });
});
