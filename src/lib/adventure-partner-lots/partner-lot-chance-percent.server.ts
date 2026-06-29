import "server-only";

import { prisma } from "@/lib/prisma";
import {
  PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  parsePartnerLotChancePercent,
  projectedPartnerLotChancePercents,
  validatePartnerLotChancePercentBudget,
  validatePartnerLotChancePercentTotal,
} from "./partner-lot-chance-percent";

export {
  PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  parsePartnerLotChancePercent,
  suggestPartnerLotChancePercentForNew,
  projectedPartnerLotChancePercentTotal,
  projectedPartnerLotChancePercents,
  validatePartnerLotChancePercentBudget,
  validatePartnerLotChancePercentTotal,
  isPartnerLotWheelReadyForPlay,
  formatPartnerLotChancePercentOverBudgetMessage,
  formatPartnerLotChancePercentDraftMessage,
  formatPartnerLotChancePercentTotalMessage,
} from "./partner-lot-chance-percent";

export async function loadWheelLotsForAdventureScope(adventureId: string) {
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

/** Vérifie que le total projeté ne dépasse pas 100 % (brouillon autorisé). */
export async function assertPartnerLotChancePercentBudgetForAdventure(
  adventureId: string,
  edited: { id: string | null; weight: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const scope = await loadWheelLotsForAdventureScope(adventureId);
  if (!scope) {
    return { ok: false, error: "Aventure introuvable." };
  }
  const projected = projectedPartnerLotChancePercents(scope.lots, edited);
  const check = validatePartnerLotChancePercentBudget(projected);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }
  return { ok: true };
}

/** @deprecated Utiliser assertPartnerLotChancePercentBudgetForAdventure */
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
