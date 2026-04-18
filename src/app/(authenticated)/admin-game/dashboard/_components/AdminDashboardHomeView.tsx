import Link from "next/link";
import { Inbox, MessageSquare, ScrollText, Store } from "lucide-react";

import type { AdminSessionCapabilities } from "@/lib/admin-session-capabilities";
import { DEFAULT_DENY_MESSAGE } from "@/components/admin/GuardedButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardOverview } from "../_lib/dashboard-overview";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type StatLinkProps = {
  href: string;
  label: string;
  value: number;
  hint?: string;
};

function StatLink({ href, label, value, hint }: StatLinkProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-2 rounded-none bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
    >
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
      <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </Link>
  );
}

export function AdminDashboardHomeView({
  displayName,
  email,
  overview,
  capabilities,
}: {
  displayName: string | null;
  email: string;
  overview: DashboardOverview;
  capabilities: AdminSessionCapabilities;
}) {
  const greeting = displayName?.trim() || email;

  if (overview.kind === "merchant") {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bonjour, {greeting}</h1>
          <p className="text-sm text-muted-foreground">
            Espace commerçant : les validations d&apos;offres partenaires se traitent dans
            l&apos;application mobile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatLink
            href="/admin-game/dashboard/commercant"
            label="Campagnes rattachées"
            value={overview.assignedAdvertisementCount}
            hint="Publicités sur lesquelles vous pouvez intervenir"
          />
          <StatLink
            href="/admin-game/dashboard/commercant"
            label="Demandes en attente"
            value={overview.pendingPartnerClaimCount}
            hint="À traiter depuis l&apos;app (session identique)"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Store className="size-4 shrink-0" aria-hidden />
              Suite
            </CardTitle>
            <CardDescription>
              Guide et références API sont rappelés sur la page dédiée.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-game/dashboard/commercant">Compte commerçant</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-game/dashboard/parametres">Paramètres</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats } = overview;
  const caps = capabilities;

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Bonjour, {greeting}. Vue d&apos;ensemble du référentiel.
        </p>
      </div>

      {caps.adventure.read ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatLink
            href="/admin-game/dashboard/aventures"
            label="Aventures"
            value={stats.adventuresTotal}
            hint={`${stats.adventuresPublic} publiques · ${stats.adventuresDemo} démo`}
          />
          <StatLink
            href="/admin-game/dashboard/aventures"
            label="Parties en cours"
            value={stats.ongoingUserAdventures}
            hint="Non terminées — détail sur chaque fiche aventure"
          />
          <StatLink
            href="/admin-game/dashboard/aventures"
            label="Avis à modérer"
            value={stats.pendingAdventureReviews}
            hint="Statut « en attente » — traitement dans la fiche aventure"
          />
          <StatLink href="/admin-game/dashboard/villes" label="Villes" value={stats.cities} />
          <StatLink
            href="/admin-game/dashboard/publicites"
            label="Publicités actives (dates)"
            value={stats.advertisementsActiveWindow}
            hint={`${stats.advertisementsTotal} enregistrées au total`}
          />
          <StatLink
            href="/admin-game/dashboard/badges-globaux"
            label="Paliers badges globaux"
            value={stats.milestoneBadges}
          />
          {typeof stats.users === "number" ? (
            <StatLink href="/admin-game/dashboard/utilisateurs" label="Comptes" value={stats.users} />
          ) : null}
          {typeof stats.pendingAdminRequests === "number" ? (
            <StatLink
              href="/admin-game/dashboard/demandes"
              label="Demandes admin en attente"
              value={stats.pendingAdminRequests}
            />
          ) : null}
        </div>
      ) : null}

      {!caps.adventure.read ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Accès limité</CardTitle>
            <CardDescription>
              Vous n&apos;avez pas la permission de lecture sur les aventures. Les statistiques du
              référentiel ne sont pas affichées. {DEFAULT_DENY_MESSAGE}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {overview.kind === "admin" && overview.reviewsPendingPreview?.length ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="size-4 shrink-0" aria-hidden />
                Avis en attente de modération
              </CardTitle>
              <CardDescription>
                Les cinq plus récents (mise à jour) — ouvrez la fiche pour valider ou refuser.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-game/dashboard/aventures">Liste des aventures</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border text-sm">
              {overview.reviewsPendingPreview.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    href={`/admin-game/dashboard/aventures/${r.adventureId}#moderation-avis`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {r.adventureName}
                  </Link>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:items-end">
                    <span>{r.authorLabel}</span>
                    <time dateTime={r.updatedAtIso}>{formatShortDate(r.updatedAtIso)}</time>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {overview.kind === "admin" && overview.pendingRequestsPreview?.length ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Inbox className="size-4 shrink-0" aria-hidden />
                Demandes récentes en attente
              </CardTitle>
              <CardDescription>Super administrateur — aperçu des cinq plus récentes.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-game/dashboard/demandes">Tout voir</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border text-sm">
              {overview.pendingRequestsPreview.map((r) => (
                <li key={r.id} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-medium text-foreground">{r.typeLabel}</span>
                    <span className="text-muted-foreground"> — {r.requesterLabel}</span>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={r.createdAtIso}>
                    {formatShortDate(r.createdAtIso)}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {overview.kind === "admin" && overview.auditPreview?.length ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ScrollText className="size-4 shrink-0" aria-hidden />
                Derniers événements d&apos;audit
              </CardTitle>
              <CardDescription>Super administrateur — les cinq actions les plus récentes.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-game/dashboard/journal-admin">Journal complet</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border font-mono text-xs">
              {overview.auditPreview.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="break-all text-foreground">{e.action}</span>
                    <span className="mt-0.5 block text-muted-foreground">par {e.actorLabel}</span>
                  </div>
                  <time className="shrink-0 text-muted-foreground" dateTime={e.createdAtIso}>
                    {formatShortDate(e.createdAtIso)}
                  </time>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

    </div>
  );
}
