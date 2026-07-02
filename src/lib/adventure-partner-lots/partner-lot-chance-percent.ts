/** Total des probabilités sur la roue (tous les lots du périmètre aventure + ville). */
export const PARTNER_LOT_CHANCE_PERCENT_TOTAL = 100;

export function parsePartnerLotChancePercent(raw: number): number | null {
  if (!Number.isFinite(raw)) {
    return null;
  }
  const n = Math.round(raw);
  if (n < 1 || n > PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return null;
  }
  return n;
}

export function sumPartnerLotChancePercents(
  lots: ReadonlyArray<{ weight: number }>
): number {
  return lots.reduce((sum, lot) => sum + lot.weight, 0);
}

export function formatPartnerLotChancePercentTotalMessage(total: number): string {
  return `La somme des probabilités doit être ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} % (actuellement ${total} %). Ajustez chaque lot.`;
}

export function validatePartnerLotChancePercentTotal(
  lots: ReadonlyArray<{ weight: number }>
): { ok: true } | { ok: false; error: string; total: number } {
  if (lots.length === 0) {
    return { ok: true };
  }
  const total = sumPartnerLotChancePercents(lots);
  if (total !== PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return {
      ok: false,
      total,
      error: formatPartnerLotChancePercentTotalMessage(total),
    };
  }
  return { ok: true };
}

/** Probabilité suggérée pour un nouveau lot (reste à 100 %). */
export function suggestPartnerLotChancePercentForNew(
  existingLots: ReadonlyArray<{ id: string; weight: number }>,
  excludeLotId?: string | null
): number {
  const others = existingLots.filter((lot) => lot.id !== excludeLotId);
  if (others.length === 0) {
    return PARTNER_LOT_CHANCE_PERCENT_TOTAL;
  }
  const used = sumPartnerLotChancePercents(others);
  const remaining = PARTNER_LOT_CHANCE_PERCENT_TOTAL - used;
  return Math.max(1, Math.min(PARTNER_LOT_CHANCE_PERCENT_TOTAL, remaining));
}

/**
 * Total après enregistrement d’un lot (création ou mise à jour).
 * `weight` en BDD = pourcentage 1–100.
 */
export function projectedPartnerLotChancePercentTotal(
  lots: ReadonlyArray<{ id: string; weight: number }>,
  edited: { id: string | null; weight: number }
): number {
  const others = lots.filter((lot) => lot.id !== edited.id);
  return sumPartnerLotChancePercents(others) + edited.weight;
}
