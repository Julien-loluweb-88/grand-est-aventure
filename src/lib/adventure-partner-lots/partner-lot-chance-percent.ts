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

export function formatPartnerLotChancePercentOverBudgetMessage(total: number): string {
  return `La somme des probabilités ne peut pas dépasser ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} % (actuellement ${total} %). Réduisez un ou plusieurs lots.`;
}

export function formatPartnerLotChancePercentDraftMessage(total: number): string {
  return `Configuration incomplète : ${total} % / ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} %. La roue ne sera visible côté joueur qu’à ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} %.`;
}

/** @deprecated Préférer formatPartnerLotChancePercentOverBudgetMessage ou formatPartnerLotChancePercentDraftMessage */
export function formatPartnerLotChancePercentTotalMessage(total: number): string {
  if (total > PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return formatPartnerLotChancePercentOverBudgetMessage(total);
  }
  if (total < PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return formatPartnerLotChancePercentDraftMessage(total);
  }
  return `Total : ${total} % / ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} %.`;
}

export function isPartnerLotWheelReadyForPlay(
  lots: ReadonlyArray<{ weight: number }>
): boolean {
  return lots.length > 0 && sumPartnerLotChancePercents(lots) === PARTNER_LOT_CHANCE_PERCENT_TOTAL;
}

/** Admin : autorise un total ≤ 100 % (brouillon) ; bloque seulement si > 100 %. */
export function validatePartnerLotChancePercentBudget(
  lots: ReadonlyArray<{ weight: number }>
): { ok: true; total: number; ready: boolean } | { ok: false; error: string; total: number } {
  if (lots.length === 0) {
    return { ok: true, total: 0, ready: false };
  }
  const total = sumPartnerLotChancePercents(lots);
  if (total > PARTNER_LOT_CHANCE_PERCENT_TOTAL) {
    return {
      ok: false,
      total,
      error: formatPartnerLotChancePercentOverBudgetMessage(total),
    };
  }
  return {
    ok: true,
    total,
    ready: total === PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  };
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

/** Probabilité suggérée pour un nouveau lot (répartition équitable quand possible). */
export function suggestPartnerLotChancePercentForNew(
  existingLots: ReadonlyArray<{ id: string; weight: number }>,
  excludeLotId?: string | null
): number {
  const others = existingLots.filter((lot) => lot.id !== excludeLotId);
  const slotCount = others.length + 1;
  const equalShare = Math.max(
    1,
    Math.floor(PARTNER_LOT_CHANCE_PERCENT_TOTAL / slotCount)
  );
  if (others.length === 0) {
    return equalShare;
  }
  const used = sumPartnerLotChancePercents(others);
  const remaining = PARTNER_LOT_CHANCE_PERCENT_TOTAL - used;
  if (remaining >= equalShare) {
    return equalShare;
  }
  if (remaining >= 1) {
    return remaining;
  }
  return equalShare;
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

/** Lots du périmètre après création ou mise à jour d’un lot. */
export function projectedPartnerLotChancePercents(
  lots: ReadonlyArray<{ id: string; weight: number }>,
  edited: { id: string | null; weight: number }
): Array<{ id: string; weight: number }> {
  const others = lots.filter((lot) => lot.id !== edited.id);
  if (edited.id == null) {
    return [...others, { id: "__new__", weight: edited.weight }];
  }
  return [...others, { id: edited.id, weight: edited.weight }];
}
