import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  COMMERCIAL_STATUS_LABELS,
  PROSPECT_EVENT_LABELS,
  hasFollowupPauseAfterCancelledMeeting,
  resolveProspectFollowupBlockReason,
} from "@/lib/prospect-events";
import { getFollowUpStepShortLabel } from "@/lib/prospect-events-constants";
import {
  getSequenceSentCount,
  isProspectSequenceComplete,
  SEQUENCE_MAIL_COUNT,
} from "@/lib/prospect-sequence";
import { requireSuperadmin } from "../utilisateurs/[id]/_lib/user-admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importProspectsFromJsonAction } from "./_lib/import-prospects-from-json.action";
import { ProspectActionsDialog } from "./_components/ProspectActionsDialog";
import { ProspectsPageToasts } from "./_components/ProspectsPageToasts";
import type { ProspectCommercialStatus } from "../../../../../../generated/prisma/client";
const PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: "ACTIVE" | "UNSUBSCRIBED" | "ALL";
    commercial?: "ALL" | "OUVERTS" | "EMAIL_REPLIED" | "QUALIFIED" | "CLOSED" | "NOT_INTERESTED";
    interco?: string;
    owner?: string;
    overdue?: string;
    page?: string;
    import?: "ok" | "error";
    created?: string;
    enriched?: string;
    total?: string;
    message?: string;
    action?: "ok" | "error";
  }>;
};

function formatDateCompact(value?: Date | null): string {
  if (!value) return "—";
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(value);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
  return `${date} ${time}`;
}

function formatDate(value?: Date | null): string {
  if (!value) return "—";
  return formatDateCompact(value);
}

function getEventBadgeClass(type: string): string {
  switch (type) {
    case "CALL_LOGGED":
      return "bg-amber-100 text-amber-800";
    case "EMAIL_SENT":
      return "bg-teal-100 text-teal-800";
    case "EMAIL_REPLIED":
      return "bg-blue-100 text-blue-800";
    case "EMAIL_BOUNCED":
      return "bg-rose-100 text-rose-800";
    case "MEETING_SCHEDULED":
      return "bg-cyan-100 text-cyan-800";
    case "MEETING_COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "MEETING_CANCELLED":
      return "bg-zinc-200 text-zinc-800";
    case "NOTE":
      return "bg-violet-100 text-violet-800";
    case "QUALIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "NOT_INTERESTED":
      return "bg-rose-100 text-rose-800";
    case "CLOSED":
      return "bg-zinc-200 text-zinc-800";
    case "REOPENED":
      return "bg-sky-100 text-sky-800";
    case "UNSUBSCRIBED":
      return "bg-zinc-200 text-zinc-800";
    default:
      return "bg-zinc-200 text-zinc-800";
  }
}

export default async function ProspectsPage({ searchParams }: Props) {  await requireSuperadmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = params.status ?? "ALL";
  const commercial = params.commercial ?? "ALL";
  const interco = (params.interco ?? "").trim();
  const ownerId = (params.owner ?? "").trim();
  const overdueOnly = params.overdue === "1";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const now = new Date();
  const importOk = params.import === "ok";
  const importError = params.import === "error";

  const overdueWhere = {
    status: "ACTIVE" as const,
    commercialStatus: "OPEN" as const,
    emailBouncedAt: null,
    sequenceCompletedAt: null,
    nextFollowUpAt: { lte: now },
    meetings: { none: { status: "SCHEDULED" as const } },
  };

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { commune: { contains: q, mode: "insensitive" as const } },
            { intercommunalite: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(commercial !== "ALL"
      ? {
          commercialStatus: (commercial === "OUVERTS"
            ? "OPEN"
            : commercial) as ProspectCommercialStatus,
        }
      : {}),
    ...(interco ? { intercommunalite: interco } : {}),
    ...(ownerId ? { ownerUserId: ownerId } : {}),
    ...(overdueOnly ? overdueWhere : {}),
  };

  const [prospects, total, activeCount, unsubscribedCount, overdueCount, intercommunalites, ownerOptions] =
    await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: [{ nextFollowUpAt: "asc" }, { firstSeenAt: "desc" }],
      skip,
      take: PAGE_SIZE,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        meetings: {
          where: { status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
        events: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            details: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.prospect.count({ where }),
    prisma.prospect.count({ where: { status: "ACTIVE" } }),
    prisma.prospect.count({ where: { status: "UNSUBSCRIBED" } }),
    prisma.prospect.count({ where: overdueWhere }),
    prisma.prospect.findMany({
      where: { intercommunalite: { not: null } },
      select: { intercommunalite: true },
      distinct: ["intercommunalite"],
      orderBy: { intercommunalite: "asc" },
    }),
    prisma.user.findMany({
      where: { ownedProspects: { some: {} } },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
  ]);

  const prospectIds = prospects.map((prospect) => prospect.id);
  const noteEvents =
    prospectIds.length > 0
      ? await prisma.prospectEvent.findMany({
          where: { prospectId: { in: prospectIds }, type: "NOTE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            prospectId: true,
            details: true,
            createdAt: true,
            createdBy: { select: { name: true } },
          },
        })
      : [];

  const notesByProspectId = new Map<
    string,
    {
      id: string;
      details: string | null;
      createdAt: Date;
      authorName: string | null;
    }[]
  >();
  for (const note of noteEvents) {
    const list = notesByProspectId.get(note.prospectId) ?? [];
    list.push({
      id: note.id,
      details: note.details,
      createdAt: note.createdAt,
      authorName: note.createdBy?.name ?? null,
    });
    notesByProspectId.set(note.prospectId, list);
  }

  const emailSendRows =
    prospectIds.length > 0
      ? await prisma.emailCampaignRecipient.findMany({
          where: { prospectId: { in: prospectIds } },
          orderBy: [{ sentAt: "asc" }, { campaign: { createdAt: "asc" } }],
          select: {
            id: true,
            prospectId: true,
            sequenceStep: true,
            sentAt: true,
            openedAt: true,
            openCount: true,
            status: true,
            error: true,
            campaign: { select: { subject: true } },
          },
        })
      : [];

  const emailSendsByProspectId = new Map<
    string,
    {
      id: string;
      sequenceStep: number | null;
      sentAt: Date | null;
      openedAt: Date | null;
      openCount: number;
      status: "PENDING" | "SENT" | "FAILED";
      error: string | null;
      subject: string;
    }[]
  >();
  for (const send of emailSendRows) {
    if (!send.prospectId) continue;
    const list = emailSendsByProspectId.get(send.prospectId) ?? [];
    list.push({
      id: send.id,
      sequenceStep: send.sequenceStep,
      sentAt: send.sentAt,
      openedAt: send.openedAt,
      openCount: send.openCount,
      status: send.status,
      error: send.error,
      subject: send.campaign.subject,
    });
    emailSendsByProspectId.set(send.prospectId, list);
  }

  const intercoOptions = intercommunalites
    .map((item) => item.intercommunalite)
    .filter((value): value is string => Boolean(value));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    const qp = new URLSearchParams();
    if (q) qp.set("q", q);
    if (status !== "ALL") qp.set("status", status);
    if (commercial !== "ALL") qp.set("commercial", commercial);
    if (interco) qp.set("interco", interco);
    if (ownerId) qp.set("owner", ownerId);
    if (overdueOnly) qp.set("overdue", "1");
    qp.set("page", String(totalPages));
    redirect(`/admin-game/dashboard/prospects?${qp.toString()}`);
  }

  return (
    <div className="space-y-6 p-6">
      <Suspense fallback={null}>
        <ProspectsPageToasts />
      </Suspense>

      <div>
        <h1 className="text-2xl font-semibold">Prospects emailing</h1>
        <p className="text-sm text-muted-foreground">
          Suivez les relances, les interactions (appels, réponses, RDV) et les désinscriptions.
        </p>      </div>

      {(importOk || importError) && (
        <div
          className={
            importOk
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"
              : "rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
          }
        >
          {importOk ? (
            <>
              <p className="font-medium text-emerald-800">Import JSON terminé.</p>
              <p className="mt-1 text-muted-foreground">
                {params.total} total — {params.created} créé(s)
                {params.enriched ? `, ${params.enriched} coordonnées mises à jour` : ""}.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-destructive">Import JSON impossible.</p>
              <p className="mt-1 text-muted-foreground">{params.message ?? "Erreur inconnue."}</p>
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Importer un JSON de prospects</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Le JSON doit contenir un tableau <code>mairies</code> avec au minimum un champ <code>email</code>.
          Les nouveaux prospects sont créés ; les existants voient leurs coordonnées mises à jour sans toucher à la séquence.
        </p>

        <form
          action={importProspectsFromJsonAction}
          className="mt-4 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Fichier JSON</label>
              <div className="rounded-md border border-dashed bg-muted/20 p-4">
                <input
                  type="file"
                  name="file"
                  accept="application/json,.json"
                  required
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2
                    file:text-sm file:font-medium file:text-primary-foreground"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Tu peux glisser-déposer ou sélectionner un fichier JSON exporté du cahier des charges.
                </p>
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium">
                Délai avant le premier envoi (jours)
              </label>
              <Input
                name="followUpDays"
                type="number"
                min={0}
                defaultValue={1}
                className="h-10"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                0 = envoi immédiat (mail de présentation). 1 = dans 1 jour.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-fit">
            Importer les nouveaux
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Actifs</p>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Désinscrits</p>
          <p className="text-2xl font-semibold">{unsubscribedCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Relances en retard</p>
          <p className="text-2xl font-semibold">{overdueCount}</p>
        </div>
      </div>

      <form method="GET" className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end">
        <div className="w-full md:max-w-sm">
          <label className="mb-1 block text-sm font-medium">Recherche</label>
          <Input name="q" defaultValue={q} placeholder="Email, commune, interco..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Statut</label>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">Tous</option>
            <option value="ACTIVE">Actifs</option>
            <option value="UNSUBSCRIBED">Désinscrits</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Statut commercial</label>
          <select
            name="commercial"
            defaultValue={commercial}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="ALL">Tous</option>
            <option value="OUVERTS">En cours</option>
            <option value="EMAIL_REPLIED">Réponse reçue</option>
            <option value="QUALIFIED">Qualifié</option>
            <option value="CLOSED">Clôturé</option>
            <option value="NOT_INTERESTED">Pas intéressé</option>
          </select>
        </div>
        <div className="w-full md:max-w-md">
          <label className="mb-1 block text-sm font-medium">Intercommunalité</label>
          <select
            name="interco"
            defaultValue={interco}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Toutes</option>
            {intercoOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:max-w-md">
          <label className="mb-1 block text-sm font-medium">Responsable</label>
          <select
            name="owner"
            defaultValue={ownerId}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Tous</option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name?.trim() || owner.email}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={overdueOnly} />
          Relances dues uniquement
        </label>
        <Button type="submit">Filtrer</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/30 text-muted-foreground">
            <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>Email</th>
              <th>Commune</th>
              <th>Interco</th>
              <th>Responsable</th>
              <th>Séquence</th>
              <th>Statut</th>
              <th>Dernier envoi</th>
              <th>Dernière ouverture</th>
              <th>Prochaine relance</th>
              <th>Dernier event</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => {
              const lastEvent = prospect.events[0];
              const prospectNotes = notesByProspectId.get(prospect.id) ?? [];
              const prospectEmailSends = emailSendsByProspectId.get(prospect.id) ?? [];
              const lastNote = prospectNotes[0] ?? null;
              const lastSentEmail = [...prospectEmailSends].reverse().find((send) => send.status === "SENT");
              const lastSentEmailOpened =
                lastSentEmail != null &&
                (lastSentEmail.openedAt != null || lastSentEmail.openCount > 0);
              const commercialStatus = COMMERCIAL_STATUS_LABELS[prospect.commercialStatus];
              const scheduledMeeting = prospect.meetings[0];
              const sequenceComplete = isProspectSequenceComplete({
                sequenceCompletedAt: prospect.sequenceCompletedAt,
              });
              const sentCount = Math.max(
                getSequenceSentCount(prospect.followUpStep, sequenceComplete),
                prospectEmailSends.filter((send) => send.status === "SENT").length
              );
              const pauseAfterCancelledMeeting = hasFollowupPauseAfterCancelledMeeting(
                prospect.events
              );
              const followupBlockReason = resolveProspectFollowupBlockReason({
                status: prospect.status,
                commercialStatus: prospect.commercialStatus,
                emailBouncedAt: prospect.emailBouncedAt,
                nextFollowUpAt: prospect.nextFollowUpAt,
                sequenceCompletedAt: prospect.sequenceCompletedAt,
                hasScheduledMeeting: scheduledMeeting != null,
                pauseAfterCancelledMeeting,
              });
              const followupBlocked = followupBlockReason != null;

              return (
                <tr key={prospect.id} className="border-t [&>td]:px-2 [&>td]:py-1.5 align-top">
                  <td className="max-w-44 truncate font-medium" title={prospect.email}>
                    {prospect.email}
                  </td>
                <td className="max-w-28 truncate">{prospect.commune ?? "—"}</td>
                <td className="max-w-40 truncate text-xs" title={prospect.intercommunalite ?? undefined}>
                  {prospect.intercommunalite ?? "—"}
                </td>
                <td className="text-xs">
                  {prospect.owner ? (
                    <span title={prospect.owner.email}>
                      {prospect.owner.name?.trim() || prospect.owner.email}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                        sequenceComplete
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {sentCount}/{SEQUENCE_MAIL_COUNT} — {getFollowUpStepShortLabel(prospect.followUpStep)}
                    </span>
                    {lastSentEmail ? (
                      <p className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground">
                        {lastSentEmailOpened ? (
                          <>
                            Ouvert
                            {lastSentEmail.openedAt
                              ? ` · ${formatDateCompact(lastSentEmail.openedAt)}`
                              : ""}
                          </>
                        ) : (
                          "Non ouvert"
                        )}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Aucun envoi</p>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={
                      prospect.status === "ACTIVE"
                        ? "rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700"
                        : "rounded-full bg-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-700"
                    }
                  >
                    {prospect.status === "ACTIVE" ? "Actif" : "Désinscrit"}
                  </span>
                </td>
                <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatDateCompact(prospect.lastContactedAt)}
                </td>
                <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatDateCompact(prospect.lastOpenedAt)}
                </td>
                <td className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {prospect.nextFollowUpAt ? (
                    formatDateCompact(prospect.nextFollowUpAt)
                  ) : followupBlockReason ? (
                    <span className="text-amber-800" title={followupBlockReason}>
                      En pause
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {lastEvent ? (
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${getEventBadgeClass(
                          lastEvent.type
                        )}`}
                      >
                        {PROSPECT_EVENT_LABELS[lastEvent.type]}
                      </span>
                      <p className="mt-0.5 whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatDateCompact(lastEvent.createdAt)}
                      </p>
                      {lastEvent.details ? (
                        <p className="mt-0.5 line-clamp-1 max-w-40 text-[11px] text-muted-foreground">
                          {lastEvent.details}
                        </p>
                      ) : null}
                      {prospect.commercialStatus !== "OPEN" ? (
                        <p className="mt-0.5">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${commercialStatus.badgeClass}`}
                          >
                            {commercialStatus.label}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {lastNote ? (
                    <div className="max-w-36">
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-800">
                        {prospectNotes.length} note{prospectNotes.length > 1 ? "s" : ""}
                      </span>
                      <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-[11px] text-muted-foreground">
                        {lastNote.details ?? "—"}
                      </p>
                      <p className="mt-0.5 whitespace-nowrap tabular-nums text-muted-foreground">
                        {formatDateCompact(lastNote.createdAt)}
                      </p>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <ProspectActionsDialog
                    prospect={{
                      id: prospect.id,
                      email: prospect.email,
                      status: prospect.status,
                      commercialStatus: prospect.commercialStatus,
                      commune: prospect.commune,
                      intercommunalite: prospect.intercommunalite,
                      telephone: prospect.telephone,
                      adresse: prospect.adresse,
                      siteInternet: prospect.siteInternet,
                      contactName: prospect.contactName,
                      ownerName: prospect.owner?.name ?? null,
                      ownerEmail: prospect.owner?.email ?? null,
                      followUpStep: prospect.followUpStep,
                      nextFollowUpAt: prospect.nextFollowUpAt,
                      sequenceCompletedAt: prospect.sequenceCompletedAt,
                      emailBouncedAt: prospect.emailBouncedAt,
                      events: prospect.events,
                      meetings: prospect.meetings,
                      notes: prospectNotes,
                      emailSends: prospectEmailSends,
                    }}
                    followupBlocked={followupBlocked}
                    followupBlockReason={followupBlockReason}
                  />
                </td></tr>
              );
            })}{prospects.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">Aucun prospect trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} prospect(s) - page {page}/{totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            asChild
          >
            <Link
              href={`/admin-game/dashboard/prospects?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status !== "ALL" ? { status } : {}),
                ...(commercial !== "ALL" ? { commercial } : {}),
                ...(interco ? { interco } : {}),
                ...(ownerId ? { owner: ownerId } : {}),
                ...(overdueOnly ? { overdue: "1" } : {}),
                page: String(Math.max(1, page - 1)),
              }).toString()}`}
            >
              Précédent
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild
          >
            <Link
              href={`/admin-game/dashboard/prospects?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status !== "ALL" ? { status } : {}),
                ...(commercial !== "ALL" ? { commercial } : {}),
                ...(interco ? { interco } : {}),
                ...(ownerId ? { owner: ownerId } : {}),
                ...(overdueOnly ? { overdue: "1" } : {}),
                page: String(Math.min(totalPages, page + 1)),
              }).toString()}`}
            >
              Suivant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
