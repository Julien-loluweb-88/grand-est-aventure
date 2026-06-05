export type AdventurePhysicalBadgesAvailability = {
  tracked: boolean;
  availableCount: number;
};

export type AdventureTreasureNotice = {
  status: "TEMPORARILY_UNAVAILABLE";
  message: string | null;
  updatedAt: string;
};

/** État courant côté joueur (badges dispo, trésor indisponible) — pas une liste de signalements. */
export type AdventurePlayAvailability = {
  hasTreasure: boolean;
  physicalBadges: AdventurePhysicalBadgesAvailability | null;
  treasureNotice: AdventureTreasureNotice | null;
};

export type AdventureMyReviewSnapshot = {
  reportsStolenTreasure: boolean;
  reportsMissingBadge: boolean;
  moderationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
};

export type PlayAvailabilitySourceRow = {
  hasTreasure: boolean;
  physicalBadgeStockCount: number;
  treasureUnavailable: boolean;
  treasureUnavailableMessage: string | null;
  treasureUnavailableUpdatedAt: Date | null;
};

export function buildPlayAvailability(
  row: PlayAvailabilitySourceRow,
  availableBadgeCount: number
): AdventurePlayAvailability {
  const tracked = row.physicalBadgeStockCount > 0;

  let treasureNotice: AdventureTreasureNotice | null = null;
  if (row.hasTreasure && row.treasureUnavailable && row.treasureUnavailableUpdatedAt) {
    treasureNotice = {
      status: "TEMPORARILY_UNAVAILABLE",
      message: row.treasureUnavailableMessage?.trim() || null,
      updatedAt: row.treasureUnavailableUpdatedAt.toISOString(),
    };
  }

  return {
    hasTreasure: row.hasTreasure,
    physicalBadges: tracked
      ? { tracked: true, availableCount: availableBadgeCount }
      : null,
    treasureNotice,
  };
}

export function playAvailabilitySourceFromCatalogRow(row: {
  treasure: { id: string } | null;
  physicalBadgeStockCount: number;
  treasureUnavailable: boolean;
  treasureUnavailableMessage: string | null;
  treasureUnavailableUpdatedAt: Date | null;
}): PlayAvailabilitySourceRow {
  return {
    hasTreasure: row.treasure != null,
    physicalBadgeStockCount: row.physicalBadgeStockCount,
    treasureUnavailable: row.treasureUnavailable,
    treasureUnavailableMessage: row.treasureUnavailableMessage,
    treasureUnavailableUpdatedAt: row.treasureUnavailableUpdatedAt,
  };
}
