import "server-only";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";
import { isSuperadmin } from "@/lib/admin-access";
import { AdventureBadgeInstanceStatus } from "@/lib/badges/prisma-enums";

export type BadgeStockHistoryEvent = {
  id: string;
  kind: string;
  availableDelta: number;
  availableAfter: number;
  note: string;
  createdAt: string;
  createdByLabel: string | null;
};

export type BadgeStockOverview = {
  totalInstances: number;
  available: number;
  claimed: number;
  stolenOrMissing: number;
  /** Nombre total d’entrées dans le journal (pour le bouton « Voir l’historique »). */
  eventCount: number;
};

export async function getBadgeStockOverview(
  adventureId: string
): Promise<BadgeStockOverview | null> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }
  if (!isSuperadmin(gate.actor.role)) {
    return null;
  }

  const base = { adventureId };

  const [
    totalInstances,
    available,
    claimed,
    stolen,
    missing,
    eventCount,
  ] = await Promise.all([
    prisma.adventureBadgeInstance.count({ where: base }),
    prisma.adventureBadgeInstance.count({
      where: { ...base, status: AdventureBadgeInstanceStatus.AVAILABLE },
    }),
    prisma.adventureBadgeInstance.count({
      where: { ...base, status: AdventureBadgeInstanceStatus.CLAIMED },
    }),
    prisma.adventureBadgeInstance.count({
      where: { ...base, status: AdventureBadgeInstanceStatus.STOLEN },
    }),
    prisma.adventureBadgeInstance.count({
      where: { ...base, status: AdventureBadgeInstanceStatus.MISSING },
    }),
    prisma.adventureBadgeStockEvent.count({ where: { adventureId } }),
  ]);

  const stolenOrMissing = stolen + missing;

  return {
    totalInstances,
    available,
    claimed,
    stolenOrMissing,
    eventCount,
  };
}
