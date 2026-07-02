"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  approveMerchantAdvertisementContent,
  rejectMerchantAdvertisementContent,
} from "../advertisement-review.action";
import { AdvertisementMerchantContentStatus } from "@/lib/advertisements/merchant-advertisement-status";
import type { AdvertisementMerchantContentStatusValue } from "@/lib/advertisements/merchant-advertisement-status";

type ReviewData = {
  id: string;
  name: string;
  merchantContentStatus: AdvertisementMerchantContentStatusValue;
  merchantRejectionReason: string | null;
  ownerMerchant: { email: string; name: string | null } | null;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  pendingTitle: string | null;
  pendingBody: string | null;
  pendingImageUrl: string | null;
  pendingTargetUrl: string | null;
  pendingPartnerBadgeTitle: string | null;
  partnerMaxRedemptionsPerUser: number;
  pendingPartnerMaxRedemptionsPerUser: number | null;
  partnerClaimsOpen: boolean;
  pendingPartnerClaimsOpen: boolean | null;
  partnerBadgeDefinition: { title: string } | null;
};

function DiffBlock({
  label,
  live,
  pending,
}: {
  label: string;
  live: string | null;
  pending: string | null;
}) {
  if (!pending?.trim() && !live?.trim()) return null;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{label}</p>
      {live?.trim() ? (
        <p className="text-muted-foreground">
          <span className="font-mono text-xs">live</span> {live}
        </p>
      ) : null}
      {pending?.trim() ? (
        <p>
          <span className="font-mono text-xs text-primary">brouillon</span> {pending}
        </p>
      ) : null}
    </div>
  );
}

export function AdvertisementReviewPanel({ ad }: { ad: ReviewData }) {
  const router = useRouter();
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  if (!ad.ownerMerchant) return null;
  if (ad.merchantContentStatus !== AdvertisementMerchantContentStatus.PENDING_REVIEW) {
    return null;
  }

  const merchantLabel = ad.ownerMerchant.name ?? ad.ownerMerchant.email;

  const handleApprove = async () => {
    setBusy("approve");
    const result = await approveMerchantAdvertisementContent(ad.id);
    setBusy(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Publicité validée et activée.");
    router.refresh();
  };

  const handleReject = async () => {
    setBusy("reject");
    const result = await rejectMerchantAdvertisementContent(ad.id, rejectionReason);
    setBusy(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Refus enregistré. Le commerçant sera notifié.");
    router.refresh();
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <h2 className="text-base font-semibold">Validation commerçant en attente</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Soumis par {merchantLabel}. Comparez le brouillon avec la version en ligne (si existante),
        puis approuvez ou refusez.
      </p>

      <div className="mt-4 space-y-3">
        <DiffBlock label="Titre" live={ad.title} pending={ad.pendingTitle} />
        <DiffBlock label="Texte" live={ad.body} pending={ad.pendingBody} />
        <DiffBlock label="Image" live={ad.imageUrl} pending={ad.pendingImageUrl} />
        <DiffBlock label="Lien" live={ad.targetUrl} pending={ad.pendingTargetUrl} />
        {ad.partnerBadgeDefinition?.title ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Nom du badge (superadmin) :</span>{" "}
            {ad.partnerBadgeDefinition.title} — inchangé par le commerçant.
          </p>
        ) : null}
        {ad.pendingPartnerMaxRedemptionsPerUser != null ? (
          <p className="text-sm">
            <span className="font-medium">Validation en commerce :</span> activée par le commerçant
          </p>
        ) : ad.pendingPartnerClaimsOpen === false &&
          ad.partnerMaxRedemptionsPerUser > 0 &&
          ad.partnerClaimsOpen ? (
          <p className="text-sm">
            <span className="font-medium">Validation en commerce :</span> désactivée
          </p>
        ) : null}
        {(ad.pendingPartnerMaxRedemptionsPerUser != null &&
          ad.pendingPartnerMaxRedemptionsPerUser !== ad.partnerMaxRedemptionsPerUser) ? (
          <p className="text-sm">
            <span className="font-medium">Validations max :</span>{" "}
            <span className="text-muted-foreground">{ad.partnerMaxRedemptionsPerUser}</span>
            {" → "}
            <span>{ad.pendingPartnerMaxRedemptionsPerUser}</span>
          </p>
        ) : null}
        {ad.pendingPartnerClaimsOpen != null &&
        ad.pendingPartnerClaimsOpen !== ad.partnerClaimsOpen ? (
          <p className="text-sm">
            <span className="font-medium">Demandes joueur :</span>{" "}
            {ad.partnerClaimsOpen ? "ouvertes" : "fermées"} →{" "}
            {ad.pendingPartnerClaimsOpen ? "ouvertes" : "fermées"}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={handleApprove} disabled={busy != null}>
          {busy === "approve" ? "Validation…" : "Approuver et activer"}
        </Button>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Field>
          <FieldLabel>Motif de refus</FieldLabel>
          <Textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Expliquez ce que le commerçant doit corriger…"
          />
        </Field>
        <Button
          type="button"
          variant="destructive"
          onClick={handleReject}
          disabled={busy != null}
        >
          {busy === "reject" ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
