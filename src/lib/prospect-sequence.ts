export const SEQUENCE_MAIL_COUNT = 3;

export function isProspectSequenceComplete(prospect: {
  sequenceCompletedAt: Date | null;
}): boolean {
  return prospect.sequenceCompletedAt != null;
}

export function getSequenceSentCount(
  followUpStep: number,
  sequenceCompleted: boolean
): number {
  if (sequenceCompleted) return SEQUENCE_MAIL_COUNT;
  return Math.min(Math.max(followUpStep, 0), SEQUENCE_MAIL_COUNT);
}

export function getNextSequenceLabel(
  followUpStep: number,
  sequenceCompleted: boolean,
  nextFollowUpAt: Date | null
): string | null {
  if (sequenceCompleted) return null;
  if (followUpStep <= 0) return "Présentation";
  if (followUpStep === 1) return "Relance J+10";
  if (followUpStep >= 2 && nextFollowUpAt) return "Dernier message";
  return null;
}

export function getSequenceStatusLabel(
  followUpStep: number,
  sequenceCompleted: boolean,
  nextFollowUpAt: Date | null
): string {
  if (sequenceCompleted) return "Séquence terminée (3/3)";
  const next = getNextSequenceLabel(followUpStep, sequenceCompleted, nextFollowUpAt);
  if (next) return `Prochain envoi : ${next}`;
  if (followUpStep >= 2) return "Dernier message en attente de planification";
  return "En cours";
}
