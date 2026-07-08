"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendProspectFollowupNow } from "@/lib/prospects-followup";
import { logProspectEvent, reopenProspect } from "@/lib/prospect-events";
import { DEFAULT_PROSPECT_CONTACT_NAME } from "@/lib/prospect-events-constants";
import { requireSuperadmin } from "../../utilisateurs/[id]/_lib/user-admin-guard";
import type { ProspectEventType } from "../../../../../../../generated/prisma/client";

const PROSPECTS_PATH = "/admin-game/dashboard/prospects";

function revalidateProspects() {
  revalidatePath(PROSPECTS_PATH);
}

function redirectProspectError(message: string): never {
  redirect(
    `${PROSPECTS_PATH}?action=error&message=${encodeURIComponent(message)}`
  );
}

function redirectProspectSuccess(message: string): never {
  redirect(`${PROSPECTS_PATH}?action=ok&message=${encodeURIComponent(message)}`);
}

export async function sendFollowupAction(formData: FormData) {
  const prospectId = String(formData.get("prospectId") ?? "");
  await requireSuperadmin();
  const res = await sendProspectFollowupNow(prospectId);
  revalidateProspects();
  if (!res.ok) redirectProspectError(res.message);
  redirectProspectSuccess(res.message);
}

export async function setProspectStatusAction(formData: FormData) {
  await requireSuperadmin();
  const prospectId = String(formData.get("prospectId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "ACTIVE" && status !== "UNSUBSCRIBED") {
    throw new Error("Statut invalide.");
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      status,
      unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
      nextFollowUpAt: status === "UNSUBSCRIBED" ? null : new Date(),
      followUpStep: status === "UNSUBSCRIBED" ? undefined : 0,
    },
  });
  revalidateProspects();
}

export async function updateProspectContactNameAction(formData: FormData) {
  await requireSuperadmin();
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!prospectId) throw new Error("Prospect introuvable.");

  const contactName = String(formData.get("contactName") ?? "").trim();
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      contactName: contactName || DEFAULT_PROSPECT_CONTACT_NAME,
    },
  });
  revalidateProspects();
}

async function logQuickEventAction(
  formData: FormData,
  type: ProspectEventType,
  requireDetails = false
) {
  const user = await requireSuperadmin();
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!prospectId) throw new Error("Prospect introuvable.");

  const details = String(formData.get("details") ?? "").trim();
  if (requireDetails && !details) {
    throw new Error("Merci de saisir une note.");
  }

  await logProspectEvent({
    prospectId,
    type,
    details: details || null,
    createdById: user.id,
  });
  revalidateProspects();
}

export async function logCallAction(formData: FormData) {
  await logQuickEventAction(formData, "CALL_LOGGED");
}

export async function logEmailReplyAction(formData: FormData) {
  await logQuickEventAction(formData, "EMAIL_REPLIED");
}

export async function logQualifiedAction(formData: FormData) {
  await logQuickEventAction(formData, "QUALIFIED");
}

export async function logNotInterestedAction(formData: FormData) {
  await logQuickEventAction(formData, "NOT_INTERESTED");
}

export async function logClosedAction(formData: FormData) {
  await logQuickEventAction(formData, "CLOSED");
}

export async function reopenProspectAction(formData: FormData) {
  const user = await requireSuperadmin();
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!prospectId) throw new Error("Prospect introuvable.");

  const details = String(formData.get("details") ?? "").trim();
  await reopenProspect({
    prospectId,
    details: details || null,
    createdById: user.id,
  });
  revalidateProspects();
}

export async function logNoteAction(formData: FormData) {
  await logQuickEventAction(formData, "NOTE", true);
}

export async function scheduleMeetingAction(formData: FormData) {
  const user = await requireSuperadmin();
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!prospectId) throw new Error("Prospect introuvable.");

  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const scheduledAt = new Date(scheduledAtRaw);
  if (!scheduledAtRaw || Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Date/heure du rendez-vous invalide.");
  }

  const durationMinutesRaw = String(formData.get("durationMinutes") ?? "").trim();
  const durationMinutes =
    durationMinutesRaw === ""
      ? null
      : Math.max(0, Number.parseInt(durationMinutesRaw, 10) || 0);

  const modeRaw = String(formData.get("mode") ?? "").trim();
  const modeAllowed = ["TELEPHONE", "VISIO", "PRESENTIEL", "AUTRE"] as const;
  const mode = modeAllowed.includes(modeRaw as (typeof modeAllowed)[number])
    ? (modeRaw as (typeof modeAllowed)[number])
    : "TELEPHONE";

  const location = String(formData.get("location") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const outcomeRaw = String(formData.get("outcome") ?? "").trim();
  const outcomeAllowed = ["INTERESTED", "NOT_INTERESTED", "UNKNOWN"] as const;
  const outcome = outcomeAllowed.includes(outcomeRaw as (typeof outcomeAllowed)[number])
    ? (outcomeRaw as (typeof outcomeAllowed)[number])
    : null;

  const meeting = await prisma.prospectMeeting.create({
    data: {
      prospectId,
      status: "SCHEDULED",
      scheduledAt,
      durationMinutes,
      mode,
      location,
      notes,
      outcome,
    },
  });

  const detailsParts = [
    `Le ${scheduledAt.toLocaleString("fr-FR")}`,
    mode === "TELEPHONE"
      ? "téléphone"
      : mode === "VISIO"
        ? "visio"
        : mode === "PRESENTIEL"
          ? "présentiel"
          : "autre",
    location ? `— ${location}` : null,
    notes ? `(${notes})` : null,
  ].filter(Boolean);

  await logProspectEvent({
    prospectId,
    type: "MEETING_SCHEDULED",
    details: detailsParts.join(" "),
    createdById: user.id,
    meetingId: meeting.id,
  });

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { nextFollowUpAt: null },
  });

  revalidateProspects();
}

export async function completeMeetingAction(formData: FormData) {
  const user = await requireSuperadmin();
  const meetingId = String(formData.get("meetingId") ?? "");
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!meetingId || !prospectId) throw new Error("Rendez-vous introuvable.");

  const outcomeRaw = String(formData.get("outcome") ?? "").trim();
  const outcomeAllowed = ["INTERESTED", "NOT_INTERESTED", "UNKNOWN"] as const;
  const outcome = outcomeAllowed.includes(outcomeRaw as (typeof outcomeAllowed)[number])
    ? (outcomeRaw as (typeof outcomeAllowed)[number])
    : "UNKNOWN";

  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.prospectMeeting.update({
    where: { id: meetingId },
    data: { status: "COMPLETED", outcome, notes: notes ?? undefined },
  });

  await logProspectEvent({
    prospectId,
    type: "MEETING_COMPLETED",
    details: notes,
    createdById: user.id,
    meetingId,
  });

  if (outcome === "INTERESTED") {
    await logProspectEvent({
      prospectId,
      type: "QUALIFIED",
      details: "Suite au rendez-vous.",
      createdById: user.id,
      meetingId,
    });
  } else if (outcome === "NOT_INTERESTED") {
    await logProspectEvent({
      prospectId,
      type: "NOT_INTERESTED",
      details: "Suite au rendez-vous.",
      createdById: user.id,
      meetingId,
    });
  }

  revalidateProspects();
}

export async function cancelMeetingAction(formData: FormData) {
  const user = await requireSuperadmin();
  const meetingId = String(formData.get("meetingId") ?? "");
  const prospectId = String(formData.get("prospectId") ?? "");
  if (!meetingId || !prospectId) throw new Error("Rendez-vous introuvable.");

  await prisma.prospectMeeting.update({
    where: { id: meetingId },
    data: { status: "CANCELLED" },
  });

  await logProspectEvent({
    prospectId,
    type: "MEETING_CANCELLED",
    details:
      "RDV annulé — les relances automatiques restent en pause jusqu'à action manuelle.",
    createdById: user.id,
    meetingId,
  });

  revalidateProspects();
}
