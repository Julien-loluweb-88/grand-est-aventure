"use client";

import { useTransition, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import type { BadgeStockOverview } from "../_lib/badge-stock-queries";
import {
  reportPhysicalBadgeLossAll,
  reportPhysicalBadgeLossPartial,
  restockPhysicalBadgeStock,
} from "../_lib/badge-stock.action";
import {
  fetchBadgeStockHistoryPage,
  type BadgeStockHistoryPageResult,
} from "../_lib/badge-stock-history.action";

function kindLabel(kind: string): string {
  switch (kind) {
    case "INITIAL_SETUP":
      return "Mise en stock initiale";
    case "RESTOCK":
      return "Réapprovisionnement";
    case "LOSS_INCIDENT":
      return "Incident / perte";
    default:
      return kind;
  }
}

export function AdventureAdminBadgeStockSection({
  adventureId,
  overview,
}: {
  adventureId: string;
  overview: BadgeStockOverview;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [pending, startTransition] = useTransition();

  const [restockQty, setRestockQty] = useState("10");
  const [restockNote, setRestockNote] = useState("");
  const [lossAllNote, setLossAllNote] = useState("");
  const [lossPartialCount, setLossPartialCount] = useState("1");
  const [lossPartialNote, setLossPartialNote] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] =
    useState<Extract<BadgeStockHistoryPageResult, { ok: true }> | null>(null);

  const refresh = () => {
    router.refresh();
  };

  useEffect(() => {
    if (!historyOpen) {
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryData(null);
    void fetchBadgeStockHistoryPage(adventureId, historyPage).then((r) => {
      if (cancelled) {
        return;
      }
      setHistoryLoading(false);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setHistoryData(r);
    });
    return () => {
      cancelled = true;
    };
  }, [historyOpen, historyPage, adventureId]);

  const pageDateRangeLabel = useMemo(() => {
    if (!historyData?.events.length) {
      return null;
    }
    const ev = historyData.events;
    const oldest = new Date(ev[ev.length - 1].createdAt);
    const newest = new Date(ev[0].createdAt);
    const fmt = (d: Date) =>
      d.toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    if (oldest.getTime() === newest.getTime()) {
      return fmt(newest);
    }
    return `Du ${fmt(oldest)} au ${fmt(newest)}`;
  }, [historyData]);

  const onRestock = () => {
    const q = Number(restockQty);
    startTransition(async () => {
      const r = await restockPhysicalBadgeStock(adventureId, q, restockNote);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Réapprovisionnement enregistré.");
      setRestockNote("");
      refresh();
    });
  };

  const onLossAll = () => {
    startTransition(async () => {
      const r = await reportPhysicalBadgeLossAll(adventureId, lossAllNote);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Incident enregistré.");
      setLossAllNote("");
      refresh();
    });
  };

  const onLossPartial = () => {
    const n = Number(lossPartialCount);
    startTransition(async () => {
      const r = await reportPhysicalBadgeLossPartial(
        adventureId,
        n,
        lossPartialNote
      );
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Incident enregistré.");
      setLossPartialNote("");
      refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock badges physiques</CardTitle>
        <CardDescription>
          Suivi du réapprovisionnement et des incidents (vol, rupture, trésor vide). Chaque action
          demande un court motif pour l’historique.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {overview.totalInstances === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun exemplaire en base pour l’instant : utilisez « Réapprovisionner » pour créer le
            premier lot, ou définissez un stock dans « Modifier » l’aventure.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Disponibles
            </p>
            <p className="text-2xl font-semibold tabular-nums">{overview.available}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Retirés (joueurs)
            </p>
            <p className="text-2xl font-semibold tabular-nums">{overview.claimed}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Perdus / volés
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {overview.stolenOrMissing}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total exemplaires
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {overview.totalInstances}
            </p>
          </div>
        </div>

        {caps.adventure.update ? (
          <div className="space-y-6 border-t pt-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">Réapprovisionner</p>
              <p className="text-xs text-muted-foreground">
                Ajoute de nouveaux numéros d’exemplaires disponibles (sans retirer ceux déjà
                distribués).
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-28">
                  <FieldLabel htmlFor="restock-qty">Quantité</FieldLabel>
                  <Input
                    id="restock-qty"
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                  />
                </Field>
                <Field className="min-w-[min(100%,20rem)] flex-1">
                  <FieldLabel htmlFor="restock-note">Motif (obligatoire)</FieldLabel>
                  <Textarea
                    id="restock-note"
                    rows={2}
                    placeholder="Ex. : nouvelle commande fournisseur, réassort avant saison…"
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    className="resize-y"
                  />
                </Field>
                <GuardedButton
                  type="button"
                  allowed={caps.adventure.update}
                  denyReason="Modification non autorisée."
                  disabled={pending}
                  onClick={onRestock}
                >
                  Enregistrer le réapprovisionnement
                </GuardedButton>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Signaler une perte</p>
              <p className="text-xs text-muted-foreground">
                Les exemplaires encore « disponibles » sont marqués comme indisponibles (vol de
                trésor, casse, etc.). Les badges déjà retirés par des joueurs ne sont pas modifiés.
              </p>
              <div className="space-y-3">
                <Field>
                  <FieldLabel htmlFor="loss-all-note">Tout le stock disponible — motif</FieldLabel>
                  <Textarea
                    id="loss-all-note"
                    rows={2}
                    placeholder="Ex. : coffre vide au point de retrait, vol du conteneur…"
                    value={lossAllNote}
                    onChange={(e) => setLossAllNote(e.target.value)}
                    className="resize-y"
                  />
                </Field>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending || overview.available === 0}
                  onClick={onLossAll}
                >
                  Enregistrer : tout le disponible est perdu
                </Button>
              </div>

              <div className="flex flex-wrap items-end gap-3 border-t border-dashed pt-4">
                <Field className="w-28">
                  <FieldLabel htmlFor="loss-partial-n">Nombre</FieldLabel>
                  <Input
                    id="loss-partial-n"
                    type="number"
                    min={1}
                    value={lossPartialCount}
                    onChange={(e) => setLossPartialCount(e.target.value)}
                  />
                </Field>
                <Field className="min-w-[min(100%,20rem)] flex-1">
                  <FieldLabel htmlFor="loss-partial-note">Motif (obligatoire)</FieldLabel>
                  <Textarea
                    id="loss-partial-note"
                    rows={2}
                    placeholder="Ex. : 3 badges endommagés retirés du point…"
                    value={lossPartialNote}
                    onChange={(e) => setLossPartialNote(e.target.value)}
                    className="resize-y"
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || overview.available === 0}
                  onClick={onLossPartial}
                >
                  Perte partielle
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {overview.eventCount === 0
              ? "Aucun événement dans le journal."
              : `${overview.eventCount} entrée(s) dans le journal (tri par date, plus récent en premier).`}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={overview.eventCount === 0}
            onClick={() => setHistoryOpen(true)}
          >
            Voir l&apos;historique
            {overview.eventCount > 0 ? ` (${overview.eventCount})` : ""}
          </Button>
        </div>

        <Dialog
          open={historyOpen}
          onOpenChange={(open) => {
            setHistoryOpen(open);
            if (open) {
              setHistoryPage(1);
            }
          }}
        >
          <DialogContent className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
            <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 text-left">
              <DialogTitle>Historique du stock</DialogTitle>
              <DialogDescription>
                Journal des réapprovisionnements et incidents, du plus récent au plus ancien.
              </DialogDescription>
              {pageDateRangeLabel ? (
                <p className="text-sm text-muted-foreground">
                  Période couverte sur cette page : {pageDateRangeLabel}
                </p>
              ) : null}
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : !historyData?.events.length ? (
                <p className="text-sm text-muted-foreground">Aucun événement sur cette page.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {historyData.events.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-border/80 bg-muted/20 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{kindLabel(e.kind)}</span>
                        <time
                          className="text-xs text-muted-foreground tabular-nums"
                          dateTime={e.createdAt}
                        >
                          {new Date(e.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Δ disponible : {e.availableDelta > 0 ? "+" : ""}
                        {e.availableDelta} → {e.availableAfter} restant(s)
                        {e.createdByLabel ? ` · ${e.createdByLabel}` : ""}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-foreground/90">{e.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
              <p className="text-xs text-muted-foreground tabular-nums">
                {historyData
                  ? `Page ${historyData.page} / ${historyData.totalPages} · ${historyData.total} entrée(s)`
                  : "—"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={
                    historyLoading ||
                    !historyData ||
                    (historyData?.page ?? historyPage) <= 1
                  }
                  onClick={() => {
                    const cur = historyData?.page ?? historyPage;
                    setHistoryPage(Math.max(1, cur - 1));
                  }}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={
                    historyLoading ||
                    !historyData ||
                    (historyData?.page ?? historyPage) >=
                      (historyData?.totalPages ?? 1)
                  }
                  onClick={() => {
                    const cur = historyData?.page ?? historyPage;
                    const max = historyData?.totalPages ?? 1;
                    setHistoryPage(Math.min(max, cur + 1));
                  }}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
