import type { ProspectCommercialStatus, ProspectEventType } from "../../generated/prisma/client";

export const DEFAULT_PROSPECT_CONTACT_NAME = "Madame / Monsieur le Maire";

export const PROSPECT_EVENT_LABELS: Record<ProspectEventType, string> = {
  CALL_LOGGED: "Appel",
  EMAIL_SENT: "Email envoyé",
  EMAIL_REPLIED: "Réponse reçue",
  EMAIL_BOUNCED: "Email invalide",
  MEETING_SCHEDULED: "RDV planifié",
  MEETING_COMPLETED: "RDV terminé",
  MEETING_CANCELLED: "RDV annulé",
  NOTE: "Note",
  QUALIFIED: "Qualifié",
  NOT_INTERESTED: "Pas intéressé",
  CLOSED: "Clôturé",
  REOPENED: "Réouvert",
  UNSUBSCRIBED: "Désinscrit",
};

export const COMMERCIAL_STATUS_LABELS: Record<
  ProspectCommercialStatus,
  { label: string; badgeClass: string }
> = {
  OPEN: { label: "Ouvert", badgeClass: "bg-sky-100 text-sky-800" },
  EMAIL_REPLIED: { label: "Réponse reçue", badgeClass: "bg-blue-100 text-blue-800" },
  QUALIFIED: { label: "Qualifié", badgeClass: "bg-emerald-100 text-emerald-800" },
  NOT_INTERESTED: { label: "Pas intéressé", badgeClass: "bg-rose-100 text-rose-800" },
  CLOSED: { label: "Clôturé", badgeClass: "bg-zinc-200 text-zinc-800" },
};

export function getProspectEventLabel(type: string): string {
  return PROSPECT_EVENT_LABELS[type as ProspectEventType] ?? type;
}

export function getFollowUpStepLabel(step: number): string {
  if (step <= 0) return "Présentation";
  if (step === 1) return "Relance J+10";
  return "Dernier message";
}

export function getFollowUpStepShortLabel(step: number): string {
  if (step <= 0) return "Intro";
  if (step === 1) return "Relance";
  return "Final";
}

export function getSequenceStepLabelFromSubject(subject: string): string | null {
  if (subject.includes("Et si") || subject.includes("chasse au trésor")) {
    return "Présentation";
  }
  if (subject.startsWith("Re :") || subject.includes("nouvelle façon")) {
    return "Relance J+10";
  }
  if (subject.includes("Dernier message")) {
    return "Dernier message";
  }
  return null;
}
