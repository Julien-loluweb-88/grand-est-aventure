"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PlayerAdventureProgressSnapshot,
  PlayerAdventureReviewSnapshot,
} from "@/lib/game/superadmin-player-progress-tools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deletePlayerAdventureReview,
  forceCompletePlayerAdventure,
  loadPlayerAdventureProgress,
  resetPlayerAdventureProgress,
  savePlayerAdventureReviewSimulation,
  searchAdventuresForProgressTools,
  searchUsersForProgressTools,
  unvalidatePlayerProgressStep,
  validateAllPlayerProgressSteps,
  validatePlayerProgressStep,
} from "./player-progress-tools.action";

type PickUser = { id: string; email: string; name: string | null; role: string | null };
type PickAdventure = {
  id: string;
  name: string;
  status: boolean | null;
  audience: string;
};

function ProgressStepsEditor({
  snapshot,
  disabled,
  onStepChange,
  onValidateAll,
}: {
  snapshot: PlayerAdventureProgressSnapshot;
  disabled: boolean;
  onStepChange: () => void;
  onValidateAll: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleValidate = (stepKey: string, label: string) => {
    startTransition(async () => {
      const res = await validatePlayerProgressStep(
        snapshot.userId,
        snapshot.adventureId,
        stepKey
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${label} validée.`);
      onStepChange();
    });
  };

  const handleUnvalidate = (stepKey: string, label: string) => {
    startTransition(async () => {
      const res = await unvalidatePlayerProgressStep(
        snapshot.userId,
        snapshot.adventureId,
        stepKey
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.revertedFinish) {
        toast.message(
          `${label} annulée — la fin de partie et les récompenses associées ont été retirées.`
        );
      } else {
        toast.success(`${label} annulée.`);
      }
      onStepChange();
    });
  };

  if (snapshot.steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cette aventure n’a ni énigme ni trésor : utilisez uniquement les actions globales ci-dessous.
      </p>
    );
  }

  const allValidated = snapshot.steps.every((s) => s.validated);

  return (
    <div className="space-y-4">
      {!allValidated ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || pending}
          onClick={onValidateAll}
        >
          Valider toutes les étapes
        </Button>
      ) : null}
    <ul className="divide-y rounded-lg border">
      {snapshot.steps.map((step) => (
        <li
          key={step.stepKey}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">{step.label}</p>
            <p className="font-mono text-xs text-muted-foreground">{step.stepKey}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {step.validated ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                Validée
              </span>
            ) : (
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                Non validée
              </span>
            )}
            {!step.validated ? (
              <Button
                type="button"
                size="sm"
                disabled={disabled || pending}
                onClick={() => handleValidate(step.stepKey, step.label)}
              >
                Valider
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || pending}
                onClick={() => handleUnvalidate(step.stepKey, step.label)}
              >
                Annuler
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
    </div>
  );
}

const MODERATION_LABELS: Record<PlayerAdventureReviewSnapshot["moderationStatus"], string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  APPROVED: "Validé (public)",
  REJECTED: "Refusé",
};

function ReviewSimulationEditor({
  snapshot,
  disabled,
  onSaved,
}: {
  snapshot: PlayerAdventureProgressSnapshot;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState("");
  const [content, setContent] = useState("");
  const [reportsMissingBadge, setReportsMissingBadge] = useState(false);
  const [reportsStolenTreasure, setReportsStolenTreasure] = useState(false);
  const [consentCommunicationNetworks, setConsentCommunicationNetworks] = useState(false);
  const [moderationStatus, setModerationStatus] =
    useState<PlayerAdventureReviewSnapshot["moderationStatus"]>("APPROVED");

  useEffect(() => {
    const r = snapshot.adventureReview;
    if (!r) {
      setRating("");
      setContent("");
      setReportsMissingBadge(false);
      setReportsStolenTreasure(false);
      setConsentCommunicationNetworks(false);
      setModerationStatus("APPROVED");
      return;
    }
    setRating(r.rating != null ? String(r.rating) : "");
    setContent(r.content ?? "");
    setReportsMissingBadge(r.reportsMissingBadge);
    setReportsStolenTreasure(r.reportsStolenTreasure);
    setConsentCommunicationNetworks(r.consentCommunicationNetworks);
    setModerationStatus(r.moderationStatus);
  }, [snapshot.adventureReview, snapshot.userId, snapshot.adventureId]);

  const applyPreset = (preset: "review" | "badge" | "treasure") => {
    if (preset === "review") {
      setRating("5");
      setContent("Super parcours, énigmes bien pensées !");
      setReportsMissingBadge(false);
      setReportsStolenTreasure(false);
      setModerationStatus("APPROVED");
      return;
    }
    if (preset === "badge") {
      setRating("");
      setContent("Plus de badges disponibles au point de retrait.");
      setReportsMissingBadge(true);
      setReportsStolenTreasure(false);
      setModerationStatus("APPROVED");
      return;
    }
    setRating("");
    setContent("Le trésor n’était plus sur place.");
    setReportsMissingBadge(false);
    setReportsStolenTreasure(true);
    setModerationStatus("APPROVED");
  };

  const handleSave = () => {
    const parsedRating =
      rating.trim() === "" ? null : Number.parseInt(rating, 10);
    if (parsedRating != null && (parsedRating < 1 || parsedRating > 5)) {
      toast.error("La note doit être entre 1 et 5.");
      return;
    }
    startTransition(async () => {
      const res = await savePlayerAdventureReviewSimulation({
        userId: snapshot.userId,
        adventureId: snapshot.adventureId,
        rating: parsedRating,
        content,
        reportsMissingBadge,
        reportsStolenTreasure,
        consentCommunicationNetworks,
        moderationStatus,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Avis / signalement enregistré.");
      onSaved();
    });
  };

  const handleDelete = () => {
    if (!snapshot.adventureReview) {
      toast.message("Aucun avis à supprimer.");
      return;
    }
    if (!window.confirm("Supprimer l’avis / signalement de ce joueur pour cette aventure ?")) {
      return;
    }
    startTransition(async () => {
      const res = await deletePlayerAdventureReview(snapshot.userId, snapshot.adventureId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Avis supprimé.");
      onSaved();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || pending}
          onClick={() => applyPreset("review")}
        >
          Préréglage : avis 5★
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || pending}
          onClick={() => applyPreset("badge")}
        >
          Préréglage : badge
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || pending}
          onClick={() => applyPreset("treasure")}
        >
          Préréglage : trésor
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Note (1 à 5, vide = pas de note)</Label>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={rating === String(n) ? "default" : "outline"}
              disabled={disabled || pending}
              onClick={() => setRating(String(n))}
            >
              {n} ★
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || pending}
            onClick={() => setRating("")}
          >
            Effacer
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-content">Commentaire</Label>
        <Textarea
          id="review-content"
          rows={3}
          placeholder="Texte de l’avis ou détail du signalement…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || pending}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Checkbox
            id="reports-missing-badge"
            checked={reportsMissingBadge}
            onCheckedChange={(v) => setReportsMissingBadge(v === true)}
            disabled={disabled || pending}
          />
          <Label htmlFor="reports-missing-badge" className="font-normal leading-snug">
            Signalement : badges en rupture / perdus / volés
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="reports-stolen-treasure"
            checked={reportsStolenTreasure}
            onCheckedChange={(v) => setReportsStolenTreasure(v === true)}
            disabled={disabled || pending}
          />
          <Label htmlFor="reports-stolen-treasure" className="font-normal leading-snug">
            Signalement : trésor absent ou volé
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent-com"
            checked={consentCommunicationNetworks}
            onCheckedChange={(v) => setConsentCommunicationNetworks(v === true)}
            disabled={disabled || pending}
          />
          <Label htmlFor="consent-com" className="font-normal leading-snug">
            Consentement communication (réseaux / supports)
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Modération (affichage public = Validé)</Label>
        <Select
          value={moderationStatus}
          onValueChange={(v) =>
            setModerationStatus(v as PlayerAdventureReviewSnapshot["moderationStatus"])
          }
          disabled={disabled || pending}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {MODERATION_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={disabled || pending} onClick={handleSave}>
          Enregistrer (simule POST /api/game/adventure-review)
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || pending || !snapshot.adventureReview}
          onClick={handleDelete}
        >
          Supprimer l’avis
        </Button>
      </div>

      {snapshot.adventureReview ? (
        <p className="text-xs text-muted-foreground">
          En base : {MODERATION_LABELS[snapshot.adventureReview.moderationStatus]} — mis à jour le{" "}
          {new Date(snapshot.adventureReview.updatedAt).toLocaleString("fr-FR")}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Aucun avis enregistré pour ce couple joueur × aventure.</p>
      )}
    </div>
  );
}

function ProgressSnapshotView({ snapshot }: { snapshot: PlayerAdventureProgressSnapshot }) {
  const finished = snapshot.userAdventure?.success === true;
  const review = snapshot.adventureReview;
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{snapshot.userName ?? snapshot.userEmail}</span>
        <span className="text-muted-foreground">×</span>
        <span className="font-medium">{snapshot.adventureName}</span>
        {finished ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            Terminée (succès)
          </span>
        ) : snapshot.userAdventure ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            Partie enregistrée (échec)
          </span>
        ) : (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            Pas de fin enregistrée
          </span>
        )}
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Étapes validées</dt>
          <dd className="font-mono text-xs">
            {snapshot.validatedStepKeys.length > 0
              ? snapshot.validatedStepKeys.join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Manquant pour finir</dt>
          <dd className="font-mono text-xs">
            {snapshot.missingStepKeysForFinish.length > 0
              ? snapshot.missingStepKeysForFinish.join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Prêt côté serveur</dt>
          <dd>{snapshot.serverReadyForSuccessFinish ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Badge aventure obtenu</dt>
          <dd>{snapshot.adventureBadgeEarned ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lot partenaire (roue)</dt>
          <dd>{snapshot.hasPartnerLotWin ? "Oui" : "Non"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Avis / signalement</dt>
          <dd>
            {review ? (
              <>
                {MODERATION_LABELS[review.moderationStatus]}
                {review.rating != null ? ` — ${review.rating}/5` : ""}
                {review.reportsMissingBadge ? " — badge signalé" : ""}
                {review.reportsStolenTreasure ? " — trésor signalé" : ""}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {snapshot.userAdventure ? (
          <div>
            <dt className="text-muted-foreground">giftNumber</dt>
            <dd>{snapshot.userAdventure.giftNumber}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function PlayerProgressToolsPanel() {
  const [pending, startTransition] = useTransition();
  const [userQuery, setUserQuery] = useState("");
  const [adventureQuery, setAdventureQuery] = useState("");
  const [userResults, setUserResults] = useState<PickUser[]>([]);
  const [adventureResults, setAdventureResults] = useState<PickAdventure[]>([]);
  const [selectedUser, setSelectedUser] = useState<PickUser | null>(null);
  const [selectedAdventure, setSelectedAdventure] = useState<PickAdventure | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerAdventureProgressSnapshot | null>(null);

  useEffect(() => {
    const q = userQuery.trim();
    if (q.length < 2) {
      setUserResults([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsersForProgressTools(q).then((res) => {
        if (res.ok) setUserResults(res.users);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  useEffect(() => {
    const q = adventureQuery.trim();
    const t = setTimeout(() => {
      searchAdventuresForProgressTools(q).then((res) => {
        if (res.ok) setAdventureResults(res.adventures);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [adventureQuery]);

  const refreshProgress = useCallback(() => {
    if (!selectedUser || !selectedAdventure) return;
    startTransition(async () => {
      const res = await loadPlayerAdventureProgress(
        selectedUser.id,
        selectedAdventure.id
      );
      if (!res.ok) {
        toast.error(res.error);
        setSnapshot(null);
        return;
      }
      setSnapshot(res.snapshot);
    });
  }, [selectedUser, selectedAdventure]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const handleForceComplete = () => {
    if (!selectedUser || !selectedAdventure) {
      toast.error("Choisissez un joueur et une aventure.");
      return;
    }
    if (
      !window.confirm(
        `Marquer « ${selectedAdventure.name} » comme terminée avec succès pour ${selectedUser.email} ?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await forceCompletePlayerAdventure(
        selectedUser.id,
        selectedAdventure.id
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.alreadyFinished) {
        toast.message("Déjà terminée avec succès.");
      } else {
        toast.success(
          res.awardedUserBadgeIds.length > 0
            ? `Terminée — ${res.awardedUserBadgeIds.length} badge(s) attribué(s).`
            : "Aventure marquée terminée avec succès."
        );
      }
      if (res.snapshot) setSnapshot(res.snapshot);
    });
  };

  const handleValidateAllSteps = () => {
    if (!selectedUser || !selectedAdventure) {
      toast.error("Choisissez un joueur et une aventure.");
      return;
    }
    startTransition(async () => {
      const res = await validateAllPlayerProgressSteps(
        selectedUser.id,
        selectedAdventure.id
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Toutes les étapes ont été validées.");
      if (res.snapshot) setSnapshot(res.snapshot);
    });
  };

  const handleReset = () => {
    if (!selectedUser || !selectedAdventure) {
      toast.error("Choisissez un joueur et une aventure.");
      return;
    }
    if (
      !window.confirm(
        `Réinitialiser toute la progression de ${selectedUser.email} sur « ${selectedAdventure.name} » ? (étapes, fin, badge aventure, lot roue, avis)`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resetPlayerAdventureProgress(
        selectedUser.id,
        selectedAdventure.id
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Progression réinitialisée.");
      if (res.snapshot) setSnapshot(res.snapshot);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cible</CardTitle>
          <CardDescription>
            Recherche par e-mail ou nom (joueur) et par nom d’aventure. Minimum 2 caractères
            pour filtrer les joueurs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-search">Joueur</Label>
              <Input
                id="user-search"
                placeholder="E-mail ou nom…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                disabled={pending}
              />
              {selectedUser ? (
                <p className="text-sm">
                  Sélectionné :{" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => setSelectedUser(null)}
                  >
                    {selectedUser.email}
                  </button>
                </p>
              ) : null}
              {userResults.length > 0 && !selectedUser ? (
                <ul className="max-h-40 overflow-auto rounded-md border text-sm">
                  {userResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserQuery(u.email);
                          setUserResults([]);
                        }}
                      >
                        {u.email}
                        {u.name ? ` — ${u.name}` : ""}
                        {u.role ? ` (${u.role})` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adventure-search">Aventure</Label>
              <Input
                id="adventure-search"
                placeholder="Nom de l’aventure…"
                value={adventureQuery}
                onChange={(e) => setAdventureQuery(e.target.value)}
                disabled={pending}
              />
              {selectedAdventure ? (
                <p className="text-sm">
                  Sélectionnée :{" "}
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => setSelectedAdventure(null)}
                  >
                    {selectedAdventure.name}
                  </button>
                </p>
              ) : null}
              {adventureResults.length > 0 && !selectedAdventure ? (
                <ul className="max-h-40 overflow-auto rounded-md border text-sm">
                  {adventureResults.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setSelectedAdventure(a);
                          setAdventureQuery(a.name);
                          setAdventureResults([]);
                        }}
                      >
                        {a.name}
                        {!a.status ? " (inactive)" : ""}
                        {a.audience === "DEMO" ? " — démo" : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !selectedUser || !selectedAdventure}
            onClick={refreshProgress}
          >
            Actualiser l’état
          </Button>
        </CardContent>
      </Card>

      {snapshot ? <ProgressSnapshotView snapshot={snapshot} /> : null}

      {snapshot && selectedUser && selectedAdventure ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étapes (énigmes & trésor)</CardTitle>
            <CardDescription>
              Valide ou annule chaque étape comme le ferait le jeu (`validate-enigma`,
              `validate-treasure`). Si vous annulez une étape après une victoire, la fin de partie
              et les badges / lot sont automatiquement retirés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressStepsEditor
              snapshot={snapshot}
              disabled={pending}
              onStepChange={refreshProgress}
              onValidateAll={handleValidateAllSteps}
            />
          </CardContent>
        </Card>
      ) : null}

      {snapshot && selectedUser && selectedAdventure ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avis & signalements (simulation)</CardTitle>
            <CardDescription>
              Reproduit l’écran de fin de partie : note, commentaire, problèmes badge / trésor.
              Choisissez <strong>Validé (public)</strong> pour tester{" "}
              <code className="text-xs">GET /api/game/adventure-reviews</code> sur l’app ou l’accueil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewSimulationEditor
              snapshot={snapshot}
              disabled={pending}
              onSaved={refreshProgress}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions globales</CardTitle>
          <CardDescription>
            Finalise quand toutes les étapes sont validées (`processGameFinish`), ou efface toute la
            progression pour repartir de zéro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={
              pending ||
              !selectedUser ||
              !selectedAdventure ||
              (snapshot != null && !snapshot.serverReadyForSuccessFinish)
            }
            title={
              snapshot && !snapshot.serverReadyForSuccessFinish
                ? "Validez d’abord toutes les étapes ci-dessus"
                : undefined
            }
            onClick={handleForceComplete}
          >
            Terminer avec succès
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !selectedUser || !selectedAdventure}
            onClick={handleReset}
          >
            Réinitialiser la progression
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !selectedUser || !selectedAdventure}
            onClick={handleForceComplete}
          >
            Raccourci : tout valider et terminer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
