import "server-only";

import { prisma } from "@/lib/prisma";
import {
  formatPartnerLotChancePercentTotalMessage,
  PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  parsePartnerLotChancePercent,
  sumPartnerLotChancePercents,
  validatePartnerLotChancePercentTotal,
} from "./partner-lot-chance-percent";

export {
  PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  parsePartnerLotChancePercent,
  suggestPartnerLotChancePercentForNew,
  projectedPartnerLotChancePercentTotal,
  validatePartnerLotChancePercentTotal,
  formatPartnerLotChancePercentTotalMessage,
} from "./partner-lot-chance-percent";

async function loadWheelLotsForAdventureScope(adventureId: string) {
  const adv = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: { cityId: true },
  });
  if (!adv) {
    return null;
  }
  const lots = await prisma.adventurePartnerLot.findMany({
    where: {
      OR: [{ adventureId }, { adventureId: null, cityId: adv.cityId }],
    },
    select: { id: true, weight: true },
  });
  return { cityId: adv.cityId, lots };
}

export async function assertPartnerLotChancePercentTotalForAdventure(
  adventureId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await loadWheelLotsForAdventureScope(adventureId);
  if (!scope) {
    return { ok: false, error: "Aventure introuvable." };
  }
  const check = validatePartnerLotChancePercentTotal(scope.lots);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }
  return { ok: true };
}

export function parsePartnerLotChancePercentInput(
  raw: number
): { ok: true; percent: number } | { ok: false; error: string } {
  const percent = parsePartnerLotChancePercent(raw);
  if (percent == null) {
    return {
      ok: false,
      error: `Probabilité invalide (entier entre 1 et ${PARTNER_LOT_CHANCE_PERCENT_TOTAL}).`,
    };
  }
  return { ok: true, percent };
}

/** Après suppression, les lots restants doivent encore totaliser 100 %. */
export async function canDeletePartnerLotKeepingPercentTotal(
  adventureId: string,
  lotId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await loadWheelLotsForAdventureScope(adventureId);
  if (!scope) {
    return { ok: false, error: "Aventure introuvable." };
  }
  const remaining = scope.lots.filter((lot) => lot.id !== lotId);
  if (remaining.length === 0) {
    return { ok: true };
  }
  const total = sumPartnerLotChancePercents(remaining);
  if (total !== PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return {
      ok: false,
      error: `${formatPartnerLotChancePercentTotalMessage(total)} Ajustez les lots restants avant de supprimer celui-ci, ou supprimez le dernier lot.`,
    };
  }
  return { ok: true };
}
