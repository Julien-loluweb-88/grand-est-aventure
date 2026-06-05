import { describe, expect, it } from "vitest";
import { buildPlayAvailability } from "./adventure-play-availability-core";

describe("buildPlayAvailability", () => {
  const base = {
    hasTreasure: true,
    physicalBadgeStockCount: 0,
    treasureUnavailable: false,
    treasureUnavailableMessage: null,
    treasureUnavailableUpdatedAt: null,
  };

  it("sans stock suivi : physicalBadges null", () => {
    const pa = buildPlayAvailability(base, 0);
    expect(pa.physicalBadges).toBeNull();
    expect(pa.treasureNotice).toBeNull();
  });

  it("stock suivi : compte disponible exposé", () => {
    const pa = buildPlayAvailability(
      { ...base, physicalBadgeStockCount: 10 },
      3
    );
    expect(pa.physicalBadges).toEqual({ tracked: true, availableCount: 3 });
  });

  it("alerte trésor admin active", () => {
    const updatedAt = new Date("2026-06-04T12:00:00.000Z");
    const pa = buildPlayAvailability(
      {
        ...base,
        treasureUnavailable: true,
        treasureUnavailableMessage: "  Réappro bientôt  ",
        treasureUnavailableUpdatedAt: updatedAt,
      },
      0
    );
    expect(pa.treasureNotice).toEqual({
      status: "TEMPORARILY_UNAVAILABLE",
      message: "Réappro bientôt",
      updatedAt: updatedAt.toISOString(),
    });
  });

  it("alerte trésor ignorée si pas de trésor configuré", () => {
    const pa = buildPlayAvailability(
      {
        ...base,
        hasTreasure: false,
        treasureUnavailable: true,
        treasureUnavailableUpdatedAt: new Date(),
      },
      0
    );
    expect(pa.treasureNotice).toBeNull();
  });
});
