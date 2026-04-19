import "server-only";

import { prisma } from "@/lib/prisma";
import { gateAdventureAction } from "@/lib/adventure-authorization";

export type AdventurePartnerLotAdminRow = {
  id: string;
  partnerName: string;
  title: string;
  description: string | null;
  redemptionHint: string | null;
  weight: number;
  quantityRemaining: number | null;
  active: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  adventureId: string | null;
  cityId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function listPartnerLotsForAdventureAdmin(adventureId: string) {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }

  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return null;
  }

  const rows = await prisma.adventurePartnerLot.findMany({
    where: {
      OR: [
        { adventureId },
        { adventureId: null, cityId: adv.cityId },
      ],
    },
    orderBy: [{ adventureId: "desc" }, { createdAt: "desc" }],
  });

  return rows as AdventurePartnerLotAdminRow[];
}

export type PartnerWheelStatRow = {
  lotId: string;
  partnerName: string;
  title: string;
  spinCount: number;
  redeemedCount: number;
  quantityRemaining: number | null;
};

export type PartnerWheelStatsPayload = {
  spinsTotal: number;
  rows: PartnerWheelStatRow[];
};

/** Tirages enregistrés sur cette aventure + lots du périmètre (aventure + ville). */
export async function getPartnerWheelStatsForAdventureAdmin(
  adventureId: string
): Promise<PartnerWheelStatsPayload | null> {
  const gate = await gateAdventureAction(adventureId, "read");
  if (!gate.ok) {
    return null;
  }

  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return null;
  }

  const [lots, winsByLot, redeemedByLot, spinsTotal] = await Promise.all([
    prisma.adventurePartnerLot.findMany({
      where: {
        OR: [{ adventureId }, { adventureId: null, cityId: adv.cityId }],
      },
      select: {
        id: true,
        partnerName: true,
        title: true,
        quantityRemaining: true,
      },
    }),
    prisma.userAdventurePartnerLotWin.groupBy({
      by: ["adventurePartnerLotId"],
      where: { adventureId },
      _count: { _all: true },
    }),
    prisma.userAdventurePartnerLotWin.groupBy({
      by: ["adventurePartnerLotId"],
      where: { adventureId, redeemedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.userAdventurePartnerLotWin.count({ where: { adventureId } }),
  ]);

  const winMap = new Map(
    winsByLot.map((w) => [w.adventurePartnerLotId, w._count._all])
  );
  const redeemedMap = new Map(
    redeemedByLot.map((w) => [w.adventurePartnerLotId, w._count._all])
  );

  const rows: PartnerWheelStatRow[] = lots.map((l) => ({
    lotId: l.id,
    partnerName: l.partnerName,
    title: l.title,
    spinCount: winMap.get(l.id) ?? 0,
    redeemedCount: redeemedMap.get(l.id) ?? 0,
    quantityRemaining: l.quantityRemaining,
  }));

  rows.sort((a, b) => {
    if (b.spinCount !== a.spinCount) return b.spinCount - a.spinCount;
    return a.title.localeCompare(b.title, "fr");
  });

  return { spinsTotal, rows };
}
