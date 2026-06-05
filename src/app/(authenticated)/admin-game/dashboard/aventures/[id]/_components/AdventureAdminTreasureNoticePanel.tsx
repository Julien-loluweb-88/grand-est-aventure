"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import type { TreasureUnavailableNoticeAdmin } from "../_lib/treasure-notice.action";
import {
  clearTreasureUnavailableNotice,
  setTreasureUnavailableNotice,
} from "../_lib/treasure-notice.action";

export function AdventureAdminTreasureNoticePanel({
  adventureId,
  notice,
}: {
  adventureId: string;
  notice: TreasureUnavailableNoticeAdmin;
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const canEdit = caps.adventure.update;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(notice.message ?? "");

  const refresh = () => router.refresh();

  const handleActivate = () => {
    startTransition(async () => {
      const result = await setTreasureUnavailableNotice(adventureId, message);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Alerte trésor activée pour les joueurs.");
      refresh();
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearTreasureUnavailableNotice(adventureId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Alerte trésor désactivée.");
      setMessage("");
      refresh();
    });
  };

  return (
    <Card className="border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="text-base">Alerte joueurs — trésor indisponible</CardTitle>
        <CardDescription>
          État affiché sur l’app mobile (home, liste, fiche). À activer quand le trésor est absent ou
          volé ; à désactiver quand il est remis en place. Les signalements joueurs restent dans la
          modération avis — ils ne pilotent pas cette alerte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice.active ? (
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Alerte active
            {notice.updatedAt
              ? ` depuis le ${new Date(notice.updatedAt).toLocaleString("fr-FR")}`
              : ""}
            {notice.message ? ` — « ${notice.message} »` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune alerte active.</p>
        )}

        <Field>
          <FieldLabel htmlFor="treasure-notice-message">Message optionnel (app mobile)</FieldLabel>
          <FieldDescription>
            Laisser vide pour le libellé par défaut côté app. Max. 500 caractères.
          </FieldDescription>
          <Textarea
            id="treasure-notice-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!canEdit || pending}
            rows={3}
            placeholder="Ex. : Réapprovisionnement prévu la semaine prochaine."
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <GuardedButton
            type="button"
            variant="default"
            allowed={canEdit}
            denyReason="Vous ne pouvez pas modifier cette alerte."
            disabled={pending}
            onClick={handleActivate}
          >
            {notice.active ? "Mettre à jour l’alerte" : "Activer l’alerte"}
          </GuardedButton>
          {notice.active ? (
            <Button type="button" variant="outline" disabled={pending || !canEdit} onClick={handleClear}>
              Désactiver l’alerte
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
