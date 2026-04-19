import { randomInt } from "node:crypto";
import type { Prisma } from "../../../generated/prisma/client";

export type AdventurePartnerLotRow = {
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
};

export function lotIsEligibleNow(
  lot: Pick<
    AdventurePartnerLotRow,
    | "active"
    | "validFrom"
    | "validUntil"
    | "quantityRemaining"
    | "weight"
  >,
  now: Date
): boolean {
  if (!lot.active || lot.weight < 1) {
    return false;
  }
  if (lot.validFrom != null && lot.validFrom > now) {
    return false;
  }
  if (lot.validUntil != null && lot.validUntil < now) {
    return false;
  }
  if (lot.quantityRemaining != null && lot.quantityRemaining <= 0) {
    return false;
  }
  return true;
}

/** Lots actifs pour la roue : liés à l’aventure OU à la ville (sans aventure). */
export function buildEligibleLotsWhere(
  adventureId: string,
  cityId: string,
  now: Date
): Prisma.AdventurePartnerLotWhereInput {
  return {
    OR: [{ adventureId }, { adventureId: null, cityId }],
    active: true,
    weight: { gte: 1 },
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      {
        OR: [{ quantityRemaining: null }, { quantityRemaining: { gt: 0 } }],
      },
    ],
  };
}

export function weightedRandomLot<T extends { id: string; weight: number }>(
  pool: T[]
): T | null {
  if (pool.length === 0) {
    return null;
  }
  const total = pool.reduce((s, p) => s + Math.max(1, p.weight), 0);
  if (total <= 0) {
    return null;
  }
  let r = randomInt(0, total);
  for (const p of pool) {
    const w = Math.max(1, p.weight);
    if (r < w) {
      return p;
    }
    r -= w;
  }
  return pool[pool.length - 1] ?? null;
}

export type PartnerLotPublicSegment = {
  id: string;
  title: string;
  partnerName: string;
};

/** Gain côté joueur après tirage (identifiants + validité + utilisation en magasin). */
export type PartnerLotWinPublic = {
  /** Identifiant du lot (`AdventurePartnerLot`). */
  id: string;
  /** Ligne de gain (`UserAdventurePartnerLotWin`) — pour support / traçabilité. */
  winId: string;
  title: string;
  partnerName: string;
  description: string | null;
  redemptionHint: string | null;
  /** ISO 8601 ; null si pas de date de début côté lot. */
  validFrom: string | null;
  /** ISO 8601 ; null si pas de fin d’offre — à afficher clairement à l’utilisateur. */
  validUntil: string | null;
  /** ISO 8601 quand le joueur a confirmé l’utilisation en boutique. */
  redeemedAt: string | null;
  redeemed: boolean;
};

export function toPublicSegment(lot: AdventurePartnerLotRow): PartnerLotPublicSegment {
  return {
    id: lot.id,
    title: lot.title,
    partnerName: lot.partnerName,
  };
}

export function toPublicWin(
  lot: AdventurePartnerLotRow,
  meta: { winId: string; redeemedAt: Date | null }
): PartnerLotWinPublic {
  return {
    id: lot.id,
    winId: meta.winId,
    title: lot.title,
    partnerName: lot.partnerName,
    description: lot.description,
    redemptionHint: lot.redemptionHint,
    validFrom: lot.validFrom ? lot.validFrom.toISOString() : null,
    validUntil: lot.validUntil ? lot.validUntil.toISOString() : null,
    redeemedAt: meta.redeemedAt ? meta.redeemedAt.toISOString() : null,
    redeemed: meta.redeemedAt != null,
  };
}
