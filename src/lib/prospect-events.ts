import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ProspectCommercialStatus,
  ProspectEventType,
} from "../../generated/prisma/client";
import {
  COMMERCIAL_STATUS_LABELS,
  PROSPECT_EVENT_LABELS,
  getFollowUpStepLabel,
} from "./prospect-events-constants";
import { isProspectSequenceComplete } from "./prospect-sequence";

export { COMMERCIAL_STATUS_LABELS, PROSPECT_EVENT_LABELS };

/** Types d'événements qui stoppent définitivement les relances email. */
export const STOP_FOLLOWUP_EVENT_TYPES: ProspectEventType[] = [
  "EMAIL_REPLIED",
  "NOT_INTERESTED",
  "QUALIFIED",
  "CLOSED",
];

const COMMERCIAL_STATUS_FROM_EVENT: Partial<
  Record<ProspectEventType, ProspectCommercialStatus>
> = {
  EMAIL_REPLIED: "EMAIL_REPLIED",
  QUALIFIED: "QUALIFIED",
  NOT_INTERESTED: "NOT_INTERESTED",
  CLOSED: "CLOSED",
};

export function shouldStopFollowupsForEvent(type: ProspectEventType): boolean {
  return STOP_FOLLOWUP_EVENT_TYPES.includes(type);
}

export function isCommercialStatusClosed(status: ProspectCommercialStatus): boolean {
  return status !== "OPEN";
}

export async function completeProspectSequence(prospectId: string): Promise<void> {
  const now = new Date();
  await prisma.prospectEvent.create({
    data: {
      prospectId,
      type: "CLOSED",
      details: "Séquence emailing terminée (3/3).",
    },
  });
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      sequenceCompletedAt: now,
      nextFollowUpAt: null,
      commercialStatus: "CLOSED",
    },
  });
}

export async function logProspectEvent(params: {
  prospectId: string;
  type: ProspectEventType;
  details?: string | null;
  createdById?: string | null;
  meetingId?: string | null;
}): Promise<void> {
  await prisma.prospectEvent.create({
    data: {
      prospectId: params.prospectId,
      type: params.type,
      details: params.details?.trim() || null,
      createdById: params.createdById ?? null,
      meetingId: params.meetingId ?? null,
    },
  });

  const commercialStatus = COMMERCIAL_STATUS_FROM_EVENT[params.type];
  if (commercialStatus) {
    await prisma.prospect.update({
      where: { id: params.prospectId },
      data: {
        commercialStatus,
        nextFollowUpAt: null,
      },
    });
  }
}

export async function logProspectEmailSent(params: {
  prospectId: string;
  sequenceStep: number | null;
}): Promise<void> {
  if (params.sequenceStep == null) return;

  await prisma.prospectEvent.create({
    data: {
      prospectId: params.prospectId,
      type: "EMAIL_SENT",
      details: `${getFollowUpStepLabel(params.sequenceStep)} envoyé.`,
    },
  });
}

export async function logProspectEmailBounce(params: {
  prospectId: string;
  details?: string | null;
}): Promise<void> {
  await prisma.prospectEvent.create({
    data: {
      prospectId: params.prospectId,
      type: "EMAIL_BOUNCED",
      details: params.details?.trim() || null,
    },
  });

  await prisma.prospect.update({
    where: { id: params.prospectId },
    data: {
      nextFollowUpAt: null,
      emailBouncedAt: new Date(),
    },
  });
}

export async function logProspectUnsubscribed(prospectId: string): Promise<void> {
  await prisma.prospectEvent.create({
    data: {
      prospectId,
      type: "UNSUBSCRIBED",
      details: "Désinscription via le lien dans l'email.",
    },
  });
}

export async function changeProspectEmailAndRestartSequence(params: {
  prospectId: string;
  newEmail: string;
  followUpDays?: number;
  createdById?: string | null;
  reason?: string | null;
}): Promise<{ oldEmail: string; newEmail: string }> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: params.prospectId },
    select: { id: true, email: true },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }

  const newEmail = params.newEmail.trim().toLowerCase();
  if (!newEmail) {
    throw new Error("Email invalide.");
  }
  if (newEmail === prospect.email.trim().toLowerCase()) {
    throw new Error("C'est déjà l'adresse email de ce prospect.");
  }

  const duplicate = await prisma.prospect.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== params.prospectId) {
    throw new Error("Cet email est déjà utilisé par un autre prospect.");
  }

  const followUpDays = Math.max(0, params.followUpDays ?? 0);
  const now = new Date();
  const nextFollowUpAt =
    followUpDays === 0
      ? now
      : new Date(now.getTime() + followUpDays * 24 * 60 * 60 * 1000);

  const oldEmail = prospect.email;
  const reason = params.reason?.trim() || null;

  await prisma.$transaction(async (tx) => {
    await tx.prospectMeeting.updateMany({
      where: { prospectId: params.prospectId, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    });

    await tx.prospect.update({
      where: { id: params.prospectId },
      data: {
        email: newEmail,
        status: "ACTIVE",
        commercialStatus: "OPEN",
        followUpStep: 0,
        nextFollowUpAt,
        sequenceCompletedAt: null,
        emailBouncedAt: null,
        unsubscribedAt: null,
        lastContactedAt: null,
        lastOpenedAt: null,
      },
    });

    await tx.prospectEvent.create({
      data: {
        prospectId: params.prospectId,
        type: "NOTE",
        details: [
          `Email changé : ${oldEmail} → ${newEmail}.`,
          "Séquence emailing relancée depuis le mail de présentation.",
          reason ? `Motif : ${reason}` : null,
        ]
          .filter(Boolean)
          .join(" "),
        createdById: params.createdById ?? null,
      },
    });
  });

  return { oldEmail, newEmail };
}

export async function reopenProspect(params: {
  prospectId: string;
  createdById?: string | null;
  details?: string | null;
}): Promise<void> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: params.prospectId },
    select: {
      commercialStatus: true,
      emailBouncedAt: true,
      sequenceCompletedAt: true,
    },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }
  if (prospect.commercialStatus === "OPEN" && !prospect.emailBouncedAt) {
    throw new Error("Ce prospect est déjà ouvert.");
  }
  if (prospect.sequenceCompletedAt) {
    throw new Error("La séquence emailing est terminée — réouverture impossible.");
  }

  await prisma.prospectEvent.create({
    data: {
      prospectId: params.prospectId,
      type: "REOPENED",
      details: params.details?.trim() || null,
      createdById: params.createdById ?? null,
    },
  });

  const sequenceComplete = isProspectSequenceComplete(prospect);

  await prisma.prospect.update({
    where: { id: params.prospectId },
    data: {
      commercialStatus: sequenceComplete ? "CLOSED" : "OPEN",
      emailBouncedAt: null,
      ...(sequenceComplete ? {} : { nextFollowUpAt: new Date() }),
    },
  });
}

export function hasFollowupPauseAfterCancelledMeeting(
  events: Array<{ type: string; createdAt: Date }>
): boolean {
  const lastCancelled = events
    .filter((event) => event.type === "MEETING_CANCELLED")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (!lastCancelled) return false;
  return !events.some(
    (event) =>
      event.type === "MEETING_SCHEDULED" &&
      event.createdAt.getTime() > lastCancelled.createdAt.getTime()
  );
}

export function resolveProspectFollowupBlockReason(input: {
  status: "ACTIVE" | "UNSUBSCRIBED";
  commercialStatus: ProspectCommercialStatus;
  emailBouncedAt: Date | null;
  nextFollowUpAt: Date | null;
  sequenceCompletedAt: Date | null;
  hasScheduledMeeting: boolean;
  pauseAfterCancelledMeeting: boolean;
}): string | null {
  if (input.status !== "ACTIVE") {
    return "Le prospect est désinscrit.";
  }
  if (input.sequenceCompletedAt) {
    return "Séquence emailing terminée (3 emails envoyés).";
  }
  if (input.hasScheduledMeeting) {
    return "Un rendez-vous est prévu — relances automatiques en pause.";
  }
  if (input.emailBouncedAt) {
    return "Email invalide (bounce).";
  }
  if (input.commercialStatus !== "OPEN") {
    return `Prospect traité (${COMMERCIAL_STATUS_LABELS[input.commercialStatus].label}).`;
  }
  if (!input.nextFollowUpAt) {
    if (input.pauseAfterCancelledMeeting) {
      return "Relances en pause suite à l'annulation du RDV.";
    }
    return "Relances en pause (aucune date planifiée).";
  }
  return null;
}

export async function getProspectFollowupBlockReason(
  prospectId: string
): Promise<string | null> {
  const [scheduledMeeting, prospect, events] = await Promise.all([
    prisma.prospectMeeting.findFirst({
      where: { prospectId, status: "SCHEDULED" },
      select: { scheduledAt: true },
    }),
    prisma.prospect.findUnique({
      where: { id: prospectId },
      select: {
        commercialStatus: true,
        emailBouncedAt: true,
        nextFollowUpAt: true,
        sequenceCompletedAt: true,
        status: true,
      },
    }),
    prisma.prospectEvent.findMany({
      where: {
        prospectId,
        type: { in: ["MEETING_CANCELLED", "MEETING_SCHEDULED"] },
      },
      select: { type: true, createdAt: true },
    }),
  ]);

  if (!prospect) return "Prospect introuvable.";

  return resolveProspectFollowupBlockReason({
    status: prospect.status,
    commercialStatus: prospect.commercialStatus,
    emailBouncedAt: prospect.emailBouncedAt,
    nextFollowUpAt: prospect.nextFollowUpAt,
    sequenceCompletedAt: prospect.sequenceCompletedAt,
    hasScheduledMeeting: scheduledMeeting != null,
    pauseAfterCancelledMeeting: hasFollowupPauseAfterCancelledMeeting(events),
  });
}

export async function isProspectFollowupBlocked(prospectId: string): Promise<boolean> {
  const reason = await getProspectFollowupBlockReason(prospectId);
  return reason != null;
}

/** Recalcule le statut commercial à partir de l'historique (migration / rattrapage). */
export async function backfillCommercialStatusForProspect(prospectId: string): Promise<void> {
  const events = await prisma.prospectEvent.findMany({
    where: {
      prospectId,
      type: { in: [...STOP_FOLLOWUP_EVENT_TYPES, "REOPENED"] },
    },
    orderBy: { createdAt: "desc" },
    select: { type: true },
  });

  let status: ProspectCommercialStatus = "OPEN";
  for (const event of events) {
    if (event.type === "REOPENED") {
      status = "OPEN";
      break;
    }
    const mapped = COMMERCIAL_STATUS_FROM_EVENT[event.type];
    if (mapped) {
      status = mapped;
      break;
    }
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { commercialStatus: status },
  });
}
