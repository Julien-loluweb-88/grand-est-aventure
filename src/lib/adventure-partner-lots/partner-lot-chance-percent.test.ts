import { describe, expect, it } from "vitest";
import {
  isPartnerLotWheelReadyForPlay,
  projectedPartnerLotChancePercentTotal,
  suggestPartnerLotChancePercentForNew,
  validatePartnerLotChancePercentBudget,
} from "./partner-lot-chance-percent";

describe("validatePartnerLotChancePercentBudget", () => {
  it("accepts empty configuration", () => {
    expect(validatePartnerLotChancePercentBudget([])).toEqual({
      ok: true,
      total: 0,
      ready: false,
    });
  });

  it("accepts draft totals below 100 %", () => {
    expect(validatePartnerLotChancePercentBudget([{ weight: 50 }])).toEqual({
      ok: true,
      total: 50,
      ready: false,
    });
  });

  it("accepts exactly 100 %", () => {
    expect(
      validatePartnerLotChancePercentBudget([{ weight: 60 }, { weight: 40 }])
    ).toEqual({
      ok: true,
      total: 100,
      ready: true,
    });
  });

  it("rejects totals above 100 %", () => {
    const result = validatePartnerLotChancePercentBudget([
      { weight: 60 },
      { weight: 50 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.total).toBe(110);
    }
  });
});

describe("isPartnerLotWheelReadyForPlay", () => {
  it("requires at least one lot and 100 % total", () => {
    expect(isPartnerLotWheelReadyForPlay([])).toBe(false);
    expect(isPartnerLotWheelReadyForPlay([{ weight: 50 }])).toBe(false);
    expect(isPartnerLotWheelReadyForPlay([{ weight: 100 }])).toBe(true);
    expect(isPartnerLotWheelReadyForPlay([{ weight: 50 }, { weight: 50 }])).toBe(
      true
    );
  });
});

describe("suggestPartnerLotChancePercentForNew", () => {
  it("suggests an equal share when adding lots", () => {
    expect(suggestPartnerLotChancePercentForNew([])).toBe(100);
    expect(
      suggestPartnerLotChancePercentForNew([{ id: "a", weight: 100 }])
    ).toBe(50);
    expect(
      suggestPartnerLotChancePercentForNew([
        { id: "a", weight: 50 },
        { id: "b", weight: 50 },
      ])
    ).toBe(33);
  });
});

describe("projectedPartnerLotChancePercentTotal", () => {
  it("replaces an existing lot when editing", () => {
    const lots = [
      { id: "a", weight: 100 },
      { id: "b", weight: 0 },
    ];
    expect(
      projectedPartnerLotChancePercentTotal(lots, { id: "a", weight: 50 })
    ).toBe(50);
  });
});
