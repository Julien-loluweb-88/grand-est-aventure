import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ProspectCommercialStatus,
  ProspectEventType,
} from "../../generated/prisma/client";
import {
  COMMERCIAL_STATUS_LABELS,
  PROSPECT_EVENT_LABELS,
} from "./prospect-events-constants";

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

export async function reopenProspect(params: {
  prospectId: string;
  createdById?: string | null;
  details?: string | null;
}): Promise<void> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: params.prospectId },
    select: { commercialStatus: true },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }
  if (prospect.commercialStatus === "OPEN") {
    throw new Error("Ce prospect est déjà ouvert.");
  }

  await prisma.prospectEvent.create({
    data: {
      prospectId: params.prospectId,
      type: "REOPENED",
      details: params.details?.trim() || null,
      createdById: params.createdById ?? null,
    },
  });

  await prisma.prospect.update({
    where: { id: params.prospectId },
    data: {
      commercialStatus: "OPEN",
      nextFollowUpAt: new Date(),
    },
  });
}

export async function getProspectFollowupBlockReason(
  prospectId: string
): Promise<string | null> {
  const [scheduledMeeting, prospect] = await Promise.all([
    prisma.prospectMeeting.findFirst({
      where: { prospectId, status: "SCHEDULED" },
      select: { scheduledAt: true },
    }),
    prisma.prospect.findUnique({
      where: { id: prospectId },
      select: { commercialStatus: true },
    }),
  ]);

  if (scheduledMeeting) {
    return "Un rendez-vous est prévu.";
  }
  if (prospect && prospect.commercialStatus !== "OPEN") {
    return `Prospect traité (${COMMERCIAL_STATUS_LABELS[prospect.commercialStatus].label}).`;
  }
  return null;
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
