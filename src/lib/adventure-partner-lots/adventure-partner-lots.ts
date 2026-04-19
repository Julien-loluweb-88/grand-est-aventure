import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type AdventurePartnerLotRow,
  type PartnerLotPublicSegment,
  type PartnerLotWinPublic,
  buildEligibleLotsWhere,
  lotIsEligibleNow,
  toPublicSegment,
  toPublicWin,
  weightedRandomLot,
} from "./adventure-partner-lots-logic";

export type {
  AdventurePartnerLotRow,
  PartnerLotPublicSegment,
  PartnerLotWinPublic,
} from "./adventure-partner-lots-logic";

export { buildEligibleLotsWhere, lotIsEligibleNow, weightedRandomLot } from "./adventure-partner-lots-logic";

type Tx = Prisma.TransactionClient;

const adventurePartnerLotPublicSelect = {
  id: true,
  partnerName: true,
  title: true,
  description: true,
  redemptionHint: true,
  weight: true,
  quantityRemaining: true,
  active: true,
  validFrom: true,
  validUntil: true,
  adventureId: true,
  cityId: true,
} as const;

export async function fetchEligiblePartnerLots(
  tx: Tx | typeof prisma,
  adventureId: string,
  cityId: string,
  now: Date
): Promise<AdventurePartnerLotRow[]> {
  const rows = await tx.adventurePartnerLot.findMany({
    where: buildEligibleLotsWhere(adventureId, cityId, now),
    select: adventurePartnerLotPublicSelect,
  });
  return rows;
}

function winToPublic(
  win: {
    id: string;
    redeemedAt: Date | null;
    adventurePartnerLot: AdventurePartnerLotRow;
  }
): PartnerLotWinPublic {
  return toPublicWin(win.adventurePartnerLot, {
    winId: win.id,
    redeemedAt: win.redeemedAt,
  });
}

/**
 * Attribue un lot (tirage pondéré, stock) ou renvoie le gain déjà enregistré.
 * À appeler dans une transaction courte ; en cas de course sur le stock, retente le tirage.
 */
export async function spinOrGetExistingPartnerLotWin(
  tx: Tx,
  input: {
    userId: string;
    adventureId: string;
    cityId: string;
    now: Date;
  }
): Promise<
  | { kind: "existing"; win: PartnerLotWinPublic }
  | { kind: "new"; win: PartnerLotWinPublic }
  | { kind: "no_lots" }
  | { kind: "stock_race"; retry: true }
> {
  const { userId, adventureId, cityId, now } = input;

  const existing = await tx.userAdventurePartnerLotWin.findUnique({
    where: {
      userId_adventureId: { userId, adventureId },
    },
    include: {
      adventurePartnerLot: {
        select: adventurePartnerLotPublicSelect,
      },
    },
  });
  if (existing) {
    return {
      kind: "existing",
      win: winToPublic({
        id: existing.id,
        redeemedAt: existing.redeemedAt,
        adventurePartnerLot: existing.adventurePartnerLot as AdventurePartnerLotRow,
      }),
    };
  }

  for (let attempt = 0; attempt < 24; attempt++) {
    const lots = await fetchEligiblePartnerLots(tx, adventureId, cityId, now);
    const pool = lots.filter((l) => lotIsEligibleNow(l, now));
    if (pool.length === 0) {
      return { kind: "no_lots" };
    }
    const chosen = weightedRandomLot(pool);
    if (!chosen) {
      return { kind: "no_lots" };
    }

    let decremented = false;
    if (chosen.quantityRemaining != null) {
      const dec = await tx.adventurePartnerLot.updateMany({
        where: {
          id: chosen.id,
          quantityRemaining: { gt: 0 },
        },
        data: { quantityRemaining: { decrement: 1 } },
      });
      if (dec.count !== 1) {
        continue;
      }
      decremented = true;
    }

    try {
      const created = await tx.userAdventurePartnerLotWin.create({
        data: {
          userId,
          adventureId,
          adventurePartnerLotId: chosen.id,
        },
        select: {
          id: true,
          redeemedAt: true,
          adventurePartnerLot: {
            select: adventurePartnerLotPublicSelect,
          },
        },
      });
      return {
        kind: "new",
        win: winToPublic({
          id: created.id,
          redeemedAt: created.redeemedAt,
          adventurePartnerLot: created.adventurePartnerLot as AdventurePartnerLotRow,
        }),
      };
    } catch (e: unknown) {
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? (e as { code?: string }).code
          : undefined;
      if (decremented) {
        await tx.adventurePartnerLot.updateMany({
          where: { id: chosen.id },
          data: { quantityRemaining: { increment: 1 } },
        });
      }
      if (code === "P2002") {
        const again = await tx.userAdventurePartnerLotWin.findUnique({
          where: { userId_adventureId: { userId, adventureId } },
          include: {
            adventurePartnerLot: {
              select: adventurePartnerLotPublicSelect,
            },
          },
        });
        if (again) {
          return {
            kind: "existing",
            win: winToPublic({
              id: again.id,
              redeemedAt: again.redeemedAt,
              adventurePartnerLot: again.adventurePartnerLot as AdventurePartnerLotRow,
            }),
          };
        }
      }
      throw e;
    }
  }

  return { kind: "stock_race", retry: true };
}

export type AdventurePartnerWheelState =
  | {
      adventureFinished: false;
      legalNotice: string | null;
    }
  | {
      adventureFinished: true;
      legalNotice: string | null;
      wheel: "none" | "ready" | "done";
      segments: PartnerLotPublicSegment[];
      won: PartnerLotWinPublic | null;
    };

export async function getAdventurePartnerWheelState(input: {
  userId: string;
  adventureId: string;
  now?: Date;
}): Promise<AdventurePartnerWheelState | null> {
  const now = input.now ?? new Date();
  const adventure = await prisma.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      id: true,
      cityId: true,
      partnerWheelTerms: true,
      city: { select: { partnerWheelTerms: true } },
    },
  });
  if (!adventure) {
    return null;
  }

  const legalNotice =
    adventure.partnerWheelTerms?.trim() ||
    adventure.city.partnerWheelTerms?.trim() ||
    null;

  const ua = await prisma.userAdventures.findFirst({
    where: { userId: input.userId, adventureId: input.adventureId },
    select: { success: true },
  });

  if (!ua?.success) {
    return { adventureFinished: false, legalNotice };
  }

  const win = await prisma.userAdventurePartnerLotWin.findUnique({
    where: {
      userId_adventureId: {
        userId: input.userId,
        adventureId: input.adventureId,
      },
    },
    include: {
      adventurePartnerLot: {
        select: adventurePartnerLotPublicSelect,
      },
    },
  });

  if (win) {
    return {
      adventureFinished: true,
      legalNotice,
      wheel: "done",
      segments: [],
      won: winToPublic({
        id: win.id,
        redeemedAt: win.redeemedAt,
        adventurePartnerLot: win.adventurePartnerLot as AdventurePartnerLotRow,
      }),
    };
  }

  const lots = await fetchEligiblePartnerLots(
    prisma,
    input.adventureId,
    adventure.cityId,
    now
  );
  const pool = lots.filter((l) => lotIsEligibleNow(l, now));
  if (pool.length === 0) {
    return {
      adventureFinished: true,
      legalNotice,
      wheel: "none",
      segments: [],
      won: null,
    };
  }
  return {
    adventureFinished: true,
    legalNotice,
    wheel: "ready",
    segments: pool.map(toPublicSegment),
    won: null,
  };
}

export type RedeemPartnerLotWinResult =
  | { ok: true; redeemedAt: string; alreadyRedeemed: boolean }
  | { ok: false; code: string; error: string; status: number };

export async function redeemPartnerLotWin(input: {
  userId: string;
  adventureId: string;
}): Promise<RedeemPartnerLotWinResult> {
  const { userId, adventureId } = input;

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.userAdventurePartnerLotWin.findUnique({
      where: { userId_adventureId: { userId, adventureId } },
      select: { id: true, redeemedAt: true },
    });
    if (!row) {
      return { kind: "no_win" as const };
    }
    if (row.redeemedAt != null) {
      return {
        kind: "already" as const,
        redeemedAt: row.redeemedAt.toISOString(),
      };
    }
    const updated = await tx.userAdventurePartnerLotWin.update({
      where: { id: row.id },
      data: { redeemedAt: new Date() },
      select: { redeemedAt: true },
    });
    return { kind: "ok" as const, redeemedAt: updated.redeemedAt!.toISOString() };
  });

  if (result.kind === "no_win") {
    return {
      ok: false,
      code: "NO_WIN",
      error: "Aucun gain à valider pour cette aventure.",
      status: 400,
    };
  }
  if (result.kind === "already") {
    return {
      ok: true,
      redeemedAt: result.redeemedAt,
      alreadyRedeemed: true,
    };
  }
  return {
    ok: true,
    redeemedAt: result.redeemedAt,
    alreadyRedeemed: false,
  };
}
