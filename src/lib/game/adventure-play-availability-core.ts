export type AdventurePhysicalBadgesAvailability = {
  tracked: boolean;
  availableCount: number;
};

export type AdventureAvailabilityNotice = {
  status: "TEMPORARILY_UNAVAILABLE";
  message: string | null;
  updatedAt: string;
};

/** État courant côté joueur (badges dispo, alertes trésor / badges) — pas une liste de signalements. */
export type AdventurePlayAvailability = {
  hasTreasure: boolean;
  physicalBadges: AdventurePhysicalBadgesAvailability | null;
  treasureNotice: AdventureAvailabilityNotice | null;
  badgesNotice: AdventureAvailabilityNotice | null;
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
  physicalBadgesUnavailable: boolean;
  physicalBadgesUnavailableMessage: string | null;
  physicalBadgesUnavailableUpdatedAt: Date | null;
};

function buildNotice(
  active: boolean,
  updatedAt: Date | null,
  message: string | null
): AdventureAvailabilityNotice | null {
  if (!active || !updatedAt) {
    return null;
  }
  return {
    status: "TEMPORARILY_UNAVAILABLE",
    message: message?.trim() || null,
    updatedAt: updatedAt.toISOString(),
  };
}

export function buildPlayAvailability(
  row: PlayAvailabilitySourceRow,
  availableBadgeCount: number
): AdventurePlayAvailability {
  const tracked = row.physicalBadgeStockCount > 0;

  const treasureNotice =
    row.hasTreasure
      ? buildNotice(
          row.treasureUnavailable,
          row.treasureUnavailableUpdatedAt,
          row.treasureUnavailableMessage
        )
      : null;

  const badgesNotice = buildNotice(
    row.physicalBadgesUnavailable,
    row.physicalBadgesUnavailableUpdatedAt,
    row.physicalBadgesUnavailableMessage
  );

  return {
    hasTreasure: row.hasTreasure,
    physicalBadges: tracked
      ? { tracked: true, availableCount: availableBadgeCount }
      : null,
    treasureNotice,
    badgesNotice,
  };
}

export function playAvailabilitySourceFromCatalogRow(row: {
  treasure: { id: string } | null;
  physicalBadgeStockCount: number;
  treasureUnavailable: boolean;
  treasureUnavailableMessage: string | null;
  treasureUnavailableUpdatedAt: Date | null;
  physicalBadgesUnavailable: boolean;
  physicalBadgesUnavailableMessage: string | null;
  physicalBadgesUnavailableUpdatedAt: Date | null;
}): PlayAvailabilitySourceRow {
  return {
    hasTreasure: row.treasure != null,
    physicalBadgeStockCount: row.physicalBadgeStockCount,
    treasureUnavailable: row.treasureUnavailable,
    treasureUnavailableMessage: row.treasureUnavailableMessage,
    treasureUnavailableUpdatedAt: row.treasureUnavailableUpdatedAt,
    physicalBadgesUnavailable: row.physicalBadgesUnavailable,
    physicalBadgesUnavailableMessage: row.physicalBadgesUnavailableMessage,
    physicalBadgesUnavailableUpdatedAt: row.physicalBadgesUnavailableUpdatedAt,
  };
}
