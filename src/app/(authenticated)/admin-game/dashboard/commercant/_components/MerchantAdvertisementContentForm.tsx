"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Gift, HelpCircle, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FieldCharacterCount } from "@/components/ui/field-character-count";
import { Textarea } from "@/components/ui/textarea";
import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";
import {
  ADVERTISEMENT_BODY_MAX_CHARS,
  ADVERTISEMENT_TITLE_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import {
  AdvertisementMerchantContentStatus,
  type AdvertisementMerchantContentStatusValue,
} from "@/lib/advertisements/merchant-advertisement-status";
import {
  saveMerchantAdvertisementDraft,
  submitMerchantAdvertisementForReview,
} from "../_lib/merchant-advertisement.action";
import {
  MerchantFieldExample,
  MerchantFieldHint,
  MerchantFormActionsHelp,
  MerchantFormGuide,
  MerchantFormSection,
  MerchantFormStatusBar,
} from "./MerchantFormLayout";

const schema = z.object({
  title: z.string().max(ADVERTISEMENT_TITLE_MAX_CHARS).optional().default(""),
  body: z.string().max(ADVERTISEMENT_BODY_MAX_CHARS).optional().default(""),
  imageUrl: z.string().max(2048).optional().default(""),
  targetUrl: z.string().max(2048).optional().default(""),
  partnerOfferEnabled: z.boolean(),
  partnerMaxRedemptionsPerUser: z.coerce.number().int().min(1).max(100),
  partnerClaimsOpen: z.boolean(),
});

export type MerchantBadgePreview = {
  badgeTitle: string | null;
  badgeImageUrl: string | null;
  badgeConfigured: boolean;
};

function BadgePreview({ preview }: { preview: MerchantBadgePreview }) {
  return (
    <div className="rounded-md border border-dashed border-violet-300 bg-violet-50/50 p-3 dark:border-violet-800 dark:bg-violet-950/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        Badge (configuré par Balad&apos;indice)
      </p>
      <MerchantFieldHint>
        Nom stable en collection joueur — les promos (-15 %, etc.) se mettent dans le titre et le
        texte de votre pub ci-dessus.
      </MerchantFieldHint>
      {preview.badgeConfigured ? (
        preview.badgeTitle ? (
          <p className="mt-2 text-sm font-medium text-foreground">{preview.badgeTitle}</p>
        ) : null
      ) : (
        <p className="mt-2 text-xs text-violet-700/80 dark:text-violet-300/80">
          Pas encore configuré — vous pouvez soumettre la pub sans offre partenaire.
        </p>
      )}
      {preview.badgeImageUrl ? (
        <div className="mt-2 h-20 w-20 overflow-hidden rounded-md border border-border bg-background p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.badgeImageUrl}
            alt="Badge partenaire"
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}

export function MerchantAdvertisementContentForm({
  advertisementId,
  advertisementName,
  advertiserName,
  status,
  rejectionReason,
  badgePreview,
  defaultValues,
}: {
  advertisementId: string;
  advertisementName: string;
  advertiserName: string;
  status: AdvertisementMerchantContentStatusValue;
  rejectionReason: string | null;
  badgePreview: MerchantBadgePreview;
  defaultValues: z.infer<typeof schema>;
}) {
  const router = useRouter();
  const draftIdRef = useRef(crypto.randomUUID());
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const pendingReview = status === AdvertisementMerchantContentStatus.PENDING_REVIEW;
  const partnerOfferEnabled = form.watch("partnerOfferEnabled");

  const buildInput = (values: z.infer<typeof schema>) => ({
    title: values.title ?? "",
    body: values.body ?? "",
    imageUrl: values.imageUrl ?? "",
    targetUrl: values.targetUrl ?? "",
    partnerOfferEnabled: values.partnerOfferEnabled,
    partnerMaxRedemptionsPerUser: values.partnerMaxRedemptionsPerUser,
    partnerClaimsOpen: values.partnerClaimsOpen,
    advertisementImageDraftId: draftIdRef.current,
  });

  const handleSaveDraft = form.handleSubmit(async (values) => {
    setIsSaving(true);
    const result = await saveMerchantAdvertisementDraft(
      advertisementId,
      buildInput(values)
    );
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Brouillon enregistré.");
    router.refresh();
  });

  const handleSubmitReview = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    const result = await submitMerchantAdvertisementForReview(
      advertisementId,
      buildInput(values)
    );
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Soumis pour validation. Vous serez notifié par e-mail.");
    router.refresh();
  });

  const titleLen = form.watch("title")?.length ?? 0;
  const bodyLen = form.watch("body")?.length ?? 0;

  return (
    <div className="space-y-5">
      <MerchantFormStatusBar
        advertisementName={advertisementName}
        advertiserName={advertiserName}
        status={status}
        rejectionReason={rejectionReason}
        pendingReview={pendingReview}
      />

      <MerchantFormGuide icon={HelpCircle} title="Deux blocs complémentaires">
        <p>
          La <strong>publicité</strong> porte vos promos du moment (titre, texte, image). Le{" "}
          <strong>badge</strong> est un libellé fixe en collection (« PMU Raon · EMP1 ») — défini
          par l&apos;équipe Balad&apos;indice, pas par vous.
        </p>
        <ol className="list-decimal space-y-1 pl-4 pt-1">
          <li>
            Remplissez le <strong>contenu de la pub</strong> avec votre promo actuelle (ex. -15 %
            cette semaine).
          </li>
          <li>
            Activez l&apos;<strong>offre partenaire</strong> seulement si vous voulez des
            validations en caisse (optionnel).
          </li>
          <li>
            <strong>Enregistrez</strong> ou <strong>soumettez</strong> pour validation.
          </li>
        </ol>
      </MerchantFormGuide>

      <form className="space-y-5">
        <MerchantFormSection
          icon={Megaphone}
          title="Contenu de la publicité"
          subtitle="Obligatoire — promos et infos visibles par les joueurs."
        >
          <Field>
            <FieldLabel htmlFor="merchant-ad-title" className="text-foreground">
              Titre de la pub
            </FieldLabel>
            <MerchantFieldHint>
              Promo ou accroche du moment — changez-le quand votre offre évolue. Après validation
              par l&apos;équipe, les joueurs pourront à nouveau demander une validation (même s&apos;ils
              avaient bénéficié de l&apos;offre précédente).
            </MerchantFieldHint>
            <MerchantFieldExample>
              « -15 % cette semaine » ou « Café offert après votre balade »
            </MerchantFieldExample>
            <Input
              id="merchant-ad-title"
              {...form.register("title")}
              placeholder="Ex. : -15 % sur tout le magasin"
              disabled={pendingReview}
            />
            <FieldCharacterCount length={titleLen} max={ADVERTISEMENT_TITLE_MAX_CHARS} />
          </Field>

          <Field>
            <FieldLabel htmlFor="merchant-ad-body" className="text-foreground">
              Texte descriptif
            </FieldLabel>
            <MerchantFieldHint>Conditions, horaires, adresse — détail de l&apos;offre.</MerchantFieldHint>
            <Textarea
              id="merchant-ad-body"
              rows={4}
              {...form.register("body")}
              placeholder="Ex. : Valable du lundi au vendredi. Présentez-vous en caisse."
              disabled={pendingReview}
            />
            <FieldCharacterCount length={bodyLen} max={ADVERTISEMENT_BODY_MAX_CHARS} />
          </Field>

          <Field>
            <DashboardImageUploadField
              scope="advertisement"
              advertisementId={advertisementId}
              label="Image de la campagne"
              description="Photo de votre établissement ou promotion (JPEG, PNG, WebP)."
              value={form.watch("imageUrl") ?? ""}
              onChange={(url) => form.setValue("imageUrl", url)}
              disabled={pendingReview}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="merchant-ad-target-url" className="text-foreground">
              Lien (URL)
            </FieldLabel>
            <MerchantFieldHint>Site web, fiche Google… Laissez vide si aucun lien.</MerchantFieldHint>
            <Input
              id="merchant-ad-target-url"
              {...form.register("targetUrl")}
              placeholder="https://www.mon-commerce.fr"
              disabled={pendingReview}
            />
          </Field>
        </MerchantFormSection>

        <MerchantFormSection
          icon={Gift}
          title="Validation en commerce"
          subtitle="Optionnel — demandes joueur à approuver en caisse."
          optional
          accentClassName="text-violet-600 dark:text-violet-400"
        >
          <BadgePreview preview={badgePreview} />

          <Field orientation="horizontal" className="items-start gap-2 rounded-md border bg-muted/30 p-3">
            <Checkbox
              id="merchant-ad-offer-enabled"
              checked={partnerOfferEnabled}
              onCheckedChange={(c) => form.setValue("partnerOfferEnabled", c === true)}
              disabled={pendingReview || !badgePreview.badgeConfigured}
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="merchant-ad-offer-enabled" className="font-medium text-foreground">
                Proposer une validation en commerce
              </FieldLabel>
              <MerchantFieldHint>
                Les joueurs pourront vous demander de valider leur visite. Désactivé = pub seule, sans
                badge à réclamer.
              </MerchantFieldHint>
              {!badgePreview.badgeConfigured ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Le badge doit d&apos;abord être configuré par l&apos;équipe Balad&apos;indice.
                </p>
              ) : null}
            </div>
          </Field>

          <div
            className={
              partnerOfferEnabled
                ? "space-y-5"
                : "space-y-5 opacity-50 pointer-events-none select-none"
            }
            aria-hidden={!partnerOfferEnabled}
          >
            <Field>
              <FieldLabel htmlFor="merchant-ad-max-redemptions" className="text-foreground">
                Validations max par joueur
              </FieldLabel>
              <MerchantFieldHint>
                Nombre de validations autorisées pour la promo en cours. Quand vous changez le
                contenu de la pub et qu&apos;il est revalidé, le compteur repart pour chaque joueur.
              </MerchantFieldHint>
              <MerchantFieldExample>1 = offre unique · 3 = trois passages autorisés</MerchantFieldExample>
              <Input
                id="merchant-ad-max-redemptions"
                type="number"
                min={1}
                max={100}
                {...form.register("partnerMaxRedemptionsPerUser")}
                disabled={pendingReview || !partnerOfferEnabled}
              />
            </Field>

            <Field orientation="horizontal" className="items-start gap-2 rounded-md border bg-muted/30 p-3">
              <Checkbox
                id="merchant-ad-claims-open"
                checked={form.watch("partnerClaimsOpen")}
                onCheckedChange={(c) => form.setValue("partnerClaimsOpen", c === true)}
                disabled={pendingReview || !partnerOfferEnabled}
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="merchant-ad-claims-open" className="font-medium text-foreground">
                  Accepter de nouvelles demandes joueur
                </FieldLabel>
                <MerchantFieldHint>
                  Décochez pour fermer temporairement les nouvelles demandes.
                </MerchantFieldHint>
              </div>
            </Field>
          </div>
        </MerchantFormSection>

        <MerchantFormActionsHelp>
          <p>
            <strong>Enregistrer brouillon</strong> — sauvegarde sans envoyer, modifiable plus tard.
          </p>
          <p>
            <strong>Soumettre pour validation</strong> — envoi à Balad&apos;indice. Le contenu pub
            suffit ; la validation en commerce est facultative.
          </p>
        </MerchantFormActionsHelp>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={pendingReview || isSaving}
            onClick={handleSaveDraft}
          >
            {isSaving ? "Enregistrement…" : "Enregistrer brouillon"}
          </Button>
          <Button
            type="button"
            disabled={pendingReview || isSubmitting}
            onClick={handleSubmitReview}
          >
            {isSubmitting ? "Envoi…" : "Soumettre pour validation"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/admin-game/dashboard/commercant/publicites">Retour à la liste</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
