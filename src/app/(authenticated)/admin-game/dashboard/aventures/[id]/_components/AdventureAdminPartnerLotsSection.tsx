"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  createPartnerLotForAdventure,
  deletePartnerLot,
  updatePartnerLot,
  saveAdventurePartnerWheelTerms,
  exportPartnerWheelStatsCsv,
  type PartnerLotWriteInput,
} from "../_lib/partner-lots.action";
import type { PartnerWheelStatsPayload } from "../_lib/partner-lots-queries";
import { PARTNER_WHEEL_TERMS_MAX_CHARS } from "@/lib/dashboard-text-limits";
import {
  PARTNER_LOT_CHANCE_PERCENT_TOTAL,
  formatPartnerLotChancePercentDraftMessage,
  formatPartnerLotChancePercentOverBudgetMessage,
  isPartnerLotWheelReadyForPlay,
  projectedPartnerLotChancePercentTotal,
  suggestPartnerLotChancePercentForNew,
  sumPartnerLotChancePercents,
} from "@/lib/adventure-partner-lots/partner-lot-chance-percent";

export type PartnerLotClientRow = {
  id: string;
  partnerName: string;
  title: string;
  description: string | null;
  redemptionHint: string | null;
  weight: number;
  quantityRemaining: number | null;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  adventureId: string | null;
  cityId: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type LotFormState = PartnerLotWriteInput & { id: string | null };

function emptyForm(lots: PartnerLotClientRow[]): LotFormState {
  return {
    id: null,
    partnerName: "",
    title: "",
    description: "",
    redemptionHint: "",
    weight: suggestPartnerLotChancePercentForNew(lots),
    quantityRemaining: null,
    active: true,
    validFromIso: null,
    validUntilIso: null,
    scope: "adventure",
  };
}

function rowToForm(row: PartnerLotClientRow): LotFormState {
  return {
    id: row.id,
    partnerName: row.partnerName,
    title: row.title,
    description: row.description ?? "",
    redemptionHint: row.redemptionHint ?? "",
    weight: row.weight,
    quantityRemaining: row.quantityRemaining,
    active: row.active,
    validFromIso: row.validFrom,
    validUntilIso: row.validUntil,
    scope: row.adventureId ? "adventure" : "city",
  };
}

function downloadCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdventureAdminPartnerLotsSection({
  adventureId,
  cityId,
  cityName,
  initialLots,
  initialWheelTerms,
  initialStats,
}: {
  adventureId: string;
  cityId: string;
  cityName: string;
  initialLots: PartnerLotClientRow[];
  initialWheelTerms: string | null;
  initialStats: PartnerWheelStatsPayload;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const canUpdate = caps.adventure.update;
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<LotFormState>(() => emptyForm(initialLots));
  const [stockText, setStockText] = useState("");
  const [wheelTermsText, setWheelTermsText] = useState(initialWheelTerms ?? "");

  useEffect(() => {
    setWheelTermsText(initialWheelTerms ?? "");
  }, [initialWheelTerms]);

  const resetForm = () => {
    setEditing(emptyForm(initialLots));
    setStockText("");
  };

  const savedPercentTotal = useMemo(
    () => sumPartnerLotChancePercents(initialLots),
    [initialLots]
  );

  const projectedPercentTotal = useMemo(
    () =>
      projectedPartnerLotChancePercentTotal(initialLots, {
        id: editing.id,
        weight: editing.weight,
      }),
    [initialLots, editing.id, editing.weight]
  );

  const percentWheelReady = isPartnerLotWheelReadyForPlay(initialLots);
  const projectedPercentOverBudget =
    projectedPercentTotal > PARTNER_LOT_CHANCE_PERCENT_TOTAL;
  const projectedPercentDraft =
    !projectedPercentOverBudget &&
    projectedPercentTotal < PARTNER_LOT_CHANCE_PERCENT_TOTAL;
  const projectedPercentCanSave = !projectedPercentOverBudget;

  const loadFromRow = (row: PartnerLotClientRow) => {
    const f = rowToForm(row);
    setEditing({ ...f, id: row.id });
    setStockText(row.quantityRemaining == null ? "" : String(row.quantityRemaining));
  };

  const buildPayload = (): PartnerLotWriteInput => {
    const stockTrim = stockText.trim();
    const quantityRemaining =
      stockTrim === "" ? null : Math.floor(Number(stockTrim));
    return {
      partnerName: editing.partnerName,
      title: editing.title,
      description: editing.description?.trim() ? editing.description.trim() : null,
      redemptionHint: editing.redemptionHint?.trim()
        ? editing.redemptionHint.trim()
        : null,
      weight: editing.weight,
      quantityRemaining:
        stockTrim === "" || Number.isNaN(quantityRemaining!)
          ? null
          : quantityRemaining,
      active: editing.active,
      validFromIso: editing.validFromIso,
      validUntilIso: editing.validUntilIso,
      scope: editing.scope,
    };
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canUpdate) return;
    if (!projectedPercentCanSave) {
      toast.error(formatPartnerLotChancePercentOverBudgetMessage(projectedPercentTotal));
      return;
    }
    startTransition(async () => {
      const payload = buildPayload();
      if (editing.id) {
        const r = await updatePartnerLot(adventureId, editing.id, payload);
        if (r.success) {
          toast.success("Lot mis à jour.");
          resetForm();
          router.refresh();
        } else {
          toast.error(r.error);
        }
      } else {
        const r = await createPartnerLotForAdventure(adventureId, payload);
        if (r.success) {
          toast.success("Lot créé.");
          resetForm();
          router.refresh();
        } else {
          toast.error(r.error);
        }
      }
    });
  };

  const onDelete = (lotId: string) => {
    if (!canUpdate) return;
    const spinCount =
      initialStats.rows.find((r) => r.lotId === lotId)?.spinCount ?? 0;
    const message =
      spinCount > 0
        ? `Écarter ce lot de la roue ? ${spinCount} tirage(s) déjà enregistré(s) seront conservés.`
        : "Supprimer ce lot ?";
    if (!window.confirm(message)) return;
    startTransition(async () => {
      const r = await deletePartnerLot(adventureId, lotId);
      if (r.success) {
        toast.success(
          r.mode === "excluded_with_history"
            ? "Lot écarté de la roue (historique conservé)."
            : "Lot supprimé."
        );
        if (editing.id === lotId) resetForm();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  };

  const onSaveWheelTerms = () => {
    if (!canUpdate) return;
    startTransition(async () => {
      const r = await saveAdventurePartnerWheelTerms(adventureId, wheelTermsText);
      if (r.success) {
        toast.success("Règlement enregistré.");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  };

  const onExportCsv = () => {
    startTransition(async () => {
      const r = await exportPartnerWheelStatsCsv(adventureId);
      if (r.success) {
        downloadCsvFile(r.csv, r.filename);
        toast.success("Export téléchargé.");
      } else {
        toast.error(r.error);
      }
    });
  };

  const showSection =
    initialLots.length > 0 ||
    canUpdate ||
    initialStats.spinsTotal > 0 ||
    Boolean(initialWheelTerms?.trim());

  if (!showSection) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roue partenaires (fin d&apos;aventure)</CardTitle>
        <CardDescription>
          Lots optionnels affichés sur la roue après une réussite : liés à{" "}
          <strong>cette aventure</strong> ou à <strong>toute la ville</strong> ({cityName}
          ). Les probabilités de tous les lots listés ci-dessous ne doivent pas dépasser{" "}
          <strong>{PARTNER_LOT_CHANCE_PERCENT_TOTAL} %</strong> ; la roue n&apos;apparaît
          côté joueur que lorsque le total atteint exactement{" "}
          <strong>{PARTNER_LOT_CHANCE_PERCENT_TOTAL} %</strong>. Sans lot actif, la roue
          n&apos;apparaît pas côté joueur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Statistiques</h3>
          <p className="text-sm text-muted-foreground">
            Tirages enregistrés sur <strong>cette aventure</strong> :{" "}
            {initialStats.spinsTotal}
          </p>
          {initialStats.rows.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="p-2 font-medium">Lot</th>
                    <th className="p-2 font-medium">Partenaire</th>
                    <th className="p-2 font-medium text-right">Tirages</th>
                    <th className="p-2 font-medium text-right">Valid. magasin</th>
                    <th className="p-2 font-medium text-right">Stock restant</th>
                  </tr>
                </thead>
                <tbody>
                  {initialStats.rows.map((r) => (
                    <tr key={r.lotId} className="border-b border-border last:border-0">
                      <td className="p-2">{r.title}</td>
                      <td className="p-2 text-muted-foreground">{r.partnerName}</td>
                      <td className="p-2 text-right tabular-nums">{r.spinCount}</td>
                      <td className="p-2 text-right tabular-nums">{r.redeemedCount}</td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">
                        {r.quantityRemaining == null ? "—" : r.quantityRemaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun lot dans le périmètre (aventure + ville) ou aucun tirage pour le moment.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => onExportCsv()}
          >
            Exporter CSV
          </Button>
        </div>

        {(canUpdate || Boolean(initialWheelTerms?.trim())) ? (
          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-foreground">
              Règlement affiché aux joueurs
            </h3>
            <p className="text-xs text-muted-foreground">
              Conditions, durée, litiges, RGPD… Texte libre. Si vous laissez ce champ vide, le
              texte défini sur la{" "}
              <Link
                href={`/admin-game/dashboard/villes/${cityId}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                fiche ville {cityName}
              </Link>{" "}
              s&apos;applique comme repli.
            </p>
            {canUpdate ? (
              <>
                <Textarea
                  id="adventure-partner-wheel-terms"
                  value={wheelTermsText}
                  onChange={(e) => setWheelTermsText(e.target.value)}
                  disabled={pending}
                  rows={8}
                  maxLength={PARTNER_WHEEL_TERMS_MAX_CHARS}
                  placeholder="Saisissez le règlement du jeu / mentions légales pour la roue sur cette aventure…"
                  className="min-h-32 font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{wheelTermsText.length} / {PARTNER_WHEEL_TERMS_MAX_CHARS}</span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => onSaveWheelTerms()}
                  >
                    Enregistrer le règlement
                  </Button>
                </div>
              </>
            ) : initialWheelTerms?.trim() ? (
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-xs">
                {initialWheelTerms}
              </pre>
            ) : null}
          </div>
        ) : null}

        {initialLots.length > 0 ? (
          <div
            className={
              percentWheelReady
                ? "rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
                : savedPercentTotal > PARTNER_LOT_CHANCE_PERCENT_TOTAL
                  ? "rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  : "rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            }
          >
            Total des probabilités enregistrées :{" "}
            <strong className="tabular-nums">{savedPercentTotal} %</strong>
            {percentWheelReady ? (
              <span> — roue prête côté joueur.</span>
            ) : savedPercentTotal > PARTNER_LOT_CHANCE_PERCENT_TOTAL ? (
              <span> — {formatPartnerLotChancePercentOverBudgetMessage(savedPercentTotal)}</span>
            ) : (
              <span> — {formatPartnerLotChancePercentDraftMessage(savedPercentTotal)}</span>
            )}
          </div>
        ) : null}

        {initialLots.length > 0 ? (
          <ul className="space-y-3 border-t border-border pt-6 text-sm">
            {initialLots.map((row) => {
              const scopeLabel =
                row.adventureId === adventureId
                  ? "Cette aventure"
                  : `Ville (${cityName})`;
              const hasRecordedSpins =
                (initialStats.rows.find((r) => r.lotId === row.id)?.spinCount ?? 0) > 0;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-md border border-border p-3 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">
                      {row.title}{" "}
                      <span className="text-muted-foreground">— {row.partnerName}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {scopeLabel} · <strong className="text-foreground">{row.weight} %</strong>
                      {row.quantityRemaining == null
                        ? " · stock illimité"
                        : ` · reste ${row.quantityRemaining}`}
                      {row.active ? "" : " · inactif"}
                    </p>
                  </div>
                  {canUpdate ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => loadFromRow(row)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={() => onDelete(row.id)}
                      >
                        {hasRecordedSpins ? "Écarter" : "Supprimer"}
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-t border-border pt-6 text-sm text-muted-foreground">
            Aucun lot configuré.
          </p>
        )}

        {canUpdate ? (
          <form onSubmit={onSubmit} className="space-y-4 border-t border-border pt-6">
            <p className="text-sm font-medium text-foreground">
              {editing.id ? "Modifier le lot" : "Ajouter un lot"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="pl-partner">Partenaire</FieldLabel>
                <Input
                  id="pl-partner"
                  value={editing.partnerName}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, partnerName: e.target.value }))
                  }
                  disabled={pending}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pl-title">Titre du lot</FieldLabel>
                <Input
                  id="pl-title"
                  value={editing.title}
                  onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                  disabled={pending}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="pl-desc">Description (optionnel)</FieldLabel>
              <Textarea
                id="pl-desc"
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, description: e.target.value }))
                }
                disabled={pending}
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pl-hint">Consigne d&apos;utilisation (optionnel)</FieldLabel>
              <Input
                id="pl-hint"
                value={editing.redemptionHint ?? ""}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, redemptionHint: e.target.value }))
                }
                disabled={pending}
                placeholder="ex. Montrez cet écran en caisse"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="pl-weight">Probabilité (%)</FieldLabel>
                <Input
                  id="pl-weight"
                  type="number"
                  min={1}
                  max={PARTNER_LOT_CHANCE_PERCENT_TOTAL}
                  value={editing.weight}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const next = Number.isFinite(raw)
                      ? Math.min(
                          PARTNER_LOT_CHANCE_PERCENT_TOTAL,
                          Math.max(1, Math.round(raw))
                        )
                      : 1;
                    setEditing((s) => ({ ...s, weight: next }));
                  }}
                  disabled={pending}
                  required
                />
                <p
                  className={
                    projectedPercentOverBudget
                      ? "mt-1 text-xs text-destructive"
                      : projectedPercentDraft
                        ? "mt-1 text-xs text-amber-700 dark:text-amber-300"
                        : "mt-1 text-xs text-muted-foreground"
                  }
                >
                  Total après enregistrement :{" "}
                  <span className="font-medium tabular-nums">{projectedPercentTotal} %</span>
                  {projectedPercentOverBudget ? (
                    <> — {formatPartnerLotChancePercentOverBudgetMessage(projectedPercentTotal)}</>
                  ) : projectedPercentDraft ? (
                    <> — {formatPartnerLotChancePercentDraftMessage(projectedPercentTotal)}</>
                  ) : (
                    ` / ${PARTNER_LOT_CHANCE_PERCENT_TOTAL} %`
                  )}
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="pl-stock">Stock restant (vide = illimité)</FieldLabel>
                <Input
                  id="pl-stock"
                  type="number"
                  min={1}
                  value={stockText}
                  onChange={(e) => setStockText(e.target.value)}
                  disabled={pending}
                  placeholder="Illimité"
                />
              </Field>
              <Field className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, active: e.target.checked }))
                    }
                    disabled={pending}
                  />
                  Actif
                </label>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="pl-from">Valide du (optionnel)</FieldLabel>
                <Input
                  id="pl-from"
                  type="date"
                  value={toDateInput(editing.validFromIso)}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      validFromIso: e.target.value
                        ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString()
                        : null,
                    }))
                  }
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pl-until">Valide jusqu&apos;au (optionnel)</FieldLabel>
                <Input
                  id="pl-until"
                  type="date"
                  value={toDateInput(editing.validUntilIso)}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      validUntilIso: e.target.value
                        ? new Date(`${e.target.value}T23:59:59.999Z`).toISOString()
                        : null,
                    }))
                  }
                  disabled={pending}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Périmètre</FieldLabel>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pl-scope"
                    checked={editing.scope === "adventure"}
                    onChange={() =>
                      setEditing((s) => ({ ...s, scope: "adventure" }))
                    }
                    disabled={pending}
                  />
                  Cette aventure uniquement
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pl-scope"
                    checked={editing.scope === "city"}
                    onChange={() => setEditing((s) => ({ ...s, scope: "city" }))}
                    disabled={pending}
                  />
                  Toute la ville ({cityName})
                </label>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending || !projectedPercentCanSave}>
                {editing.id ? "Enregistrer" : "Créer le lot"}
              </Button>
              {editing.id ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={resetForm}
                >
                  Annuler
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
