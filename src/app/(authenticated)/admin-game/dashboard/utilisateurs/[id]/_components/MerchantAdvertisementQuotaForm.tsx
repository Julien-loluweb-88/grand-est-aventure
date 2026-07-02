"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { updateMerchantAdvertisementQuota } from "@/app/(authenticated)/admin-game/dashboard/publicites/advertisement-slot.action";
import { Field, FieldLabel } from "@/components/ui/field";

export function MerchantAdvertisementQuotaForm(props: {
  userId: string;
  initialMaxSlots: number | null;
  usedSlots: number;
}) {
  const caps = useAdminCapabilities();
  const [maxSlots, setMaxSlots] = useState(
    props.initialMaxSlots != null ? String(props.initialMaxSlots) : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const trimmed = maxSlots.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed != null && (!Number.isInteger(parsed) || parsed < 0)) {
      setIsSaving(false);
      toast.error("Quota invalide.");
      return;
    }
    const result = await updateMerchantAdvertisementQuota(props.userId, parsed);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Quota enregistré.");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Emplacements déjà créés : <strong>{props.usedSlots}</strong>
      </p>
      <Field>
        <FieldLabel htmlFor="merchant-ad-quota">Nombre max d&apos;emplacements publicitaires</FieldLabel>
        <Input
          id="merchant-ad-quota"
          type="number"
          min={0}
          max={100}
          placeholder="Ex. 2 — laisser vide pour aucun quota"
          value={maxSlots}
          onChange={(e) => setMaxSlots(e.target.value)}
          disabled={!caps.canAssignRolesAndScopes}
        />
      </Field>
      <GuardedButton
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        allowed={caps.canAssignRolesAndScopes}
        denyReason="Seul un super administrateur peut définir le quota commerçant."
      >
        {isSaving ? "Enregistrement…" : "Enregistrer le quota"}
      </GuardedButton>
    </div>
  );
}
