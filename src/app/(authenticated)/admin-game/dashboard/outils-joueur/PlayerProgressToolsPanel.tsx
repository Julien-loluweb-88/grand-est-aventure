"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlayerAdventureProgressSnapshot } from "@/lib/game/superadmin-player-progress-tools";
import {
  forceCompletePlayerAdventure,
  loadPlayerAdventureProgress,
  resetPlayerAdventureProgress,
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

function ProgressSnapshotView({ snapshot }: { snapshot: PlayerAdventureProgressSnapshot }) {
  const finished = snapshot.userAdventure?.success === true;
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
