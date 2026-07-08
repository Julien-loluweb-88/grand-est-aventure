"use client";

import {
  getFollowUpStepShortLabel,
  getSequenceStepLabelFromSubject,
} from "@/lib/prospect-events-constants";
import {
  SEQUENCE_MAIL_COUNT,
  getSequenceSentCount,
  getSequenceStatusLabel,
  isProspectSequenceComplete,
} from "@/lib/prospect-sequence";

type EmailSendLite = {
  id: string;
  sequenceStep: number | null;
  sentAt: Date | null;
  openedAt: Date | null;
  openCount: number;
  status: "PENDING" | "SENT" | "FAILED";
  error: string | null;
  subject: string;
};

function formatDate(value?: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStepLabel(send: EmailSendLite): string {
  if (send.sequenceStep != null) {
    return getFollowUpStepShortLabel(send.sequenceStep);
  }
  return getSequenceStepLabelFromSubject(send.subject) ?? "Email campagne";
}

export function ProspectEmailSequence(props: {
  followUpStep: number;
  nextFollowUpAt: Date | null;
  sequenceCompletedAt: Date | null;
  emailSends: EmailSendLite[];
}) {
  const sequenceComplete = isProspectSequenceComplete({
    sequenceCompletedAt: props.sequenceCompletedAt,
  });
  const sentCount = Math.max(
    getSequenceSentCount(props.followUpStep, sequenceComplete),
    props.emailSends.filter((send) => send.status === "SENT").length
  );
  const statusLabel = getSequenceStatusLabel(
    props.followUpStep,
    sequenceComplete,
    props.nextFollowUpAt
  );

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Séquence emailing</p>
          <p className="mt-1 text-sm text-muted-foreground">{statusLabel}</p>
          {props.nextFollowUpAt && !sequenceComplete ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Prochaine relance prévue : {formatDate(props.nextFollowUpAt)}
            </p>
          ) : null}
          {sequenceComplete ? (
            <p className="mt-1 text-xs text-emerald-700">
              Les 3 emails ont été envoyés — plus de relance automatique.
            </p>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            sequenceComplete
              ? "bg-emerald-100 text-emerald-800"
              : "bg-sky-100 text-sky-800"
          }`}
        >
          {sentCount}/{SEQUENCE_MAIL_COUNT}
          {sequenceComplete ? " — terminée" : ""}
        </span>
      </div>

      {props.emailSends.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Étape</th>
                <th className="pb-2 pr-3 font-medium">Envoyé le</th>
                <th className="pb-2 pr-3 font-medium">Statut</th>
                <th className="pb-2 font-medium">Ouverture</th>
              </tr>
            </thead>
            <tbody>
              {props.emailSends.map((send) => (
                <tr key={send.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{getStepLabel(send)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{formatDate(send.sentAt)}</td>
                  <td className="py-2 pr-3">
                    {send.status === "SENT" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Envoyé
                      </span>
                    ) : send.status === "FAILED" ? (
                      <span
                        className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800"
                        title={send.error ?? undefined}
                      >
                        Échec
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {send.status !== "SENT" ? (
                      "—"
                    ) : send.openedAt || send.openCount > 0 ? (
                      <span className="text-emerald-700">
                        Ouvert{send.openCount > 1 ? ` (${send.openCount}×)` : ""}
                        {send.openedAt ? ` — ${formatDate(send.openedAt)}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Pas encore ouvert</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {sequenceComplete
            ? "Historique des envois non disponible."
            : "Aucun email envoyé pour l'instant."}
        </p>
      )}
    </div>
  );
}
