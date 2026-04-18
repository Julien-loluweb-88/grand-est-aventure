"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldCharacterCount } from "@/components/ui/field-character-count";
import {
  ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS,
  ADMIN_REQUEST_TYPE_KEY_MAX_CHARS,
  ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS,
} from "@/lib/dashboard-text-limits";
import { createAdminRequestType } from "../aventures/request-adventure.action";

export function AdminRequestTypeCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [keyValue, setKeyValue] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAdminRequestType({
        key: keyValue,
        label,
        description,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Type de demande créé.");
      setKeyValue("");
      setLabel("");
      setDescription("");
      router.refresh();
    });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="request-type-key">Key (slug technique)</Label>
        <Input
          id="request-type-key"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder="ex: campaign_asset_request"
          required
          minLength={3}
          maxLength={ADMIN_REQUEST_TYPE_KEY_MAX_CHARS}
          disabled={pending}
        />
        <div className="flex justify-end">
          <FieldCharacterCount length={keyValue.length} max={ADMIN_REQUEST_TYPE_KEY_MAX_CHARS} />
        </div>
        <p className="text-xs text-muted-foreground">
          Utilisez uniquement des lettres minuscules, chiffres et underscores. La key doit
          rester stable dans le temps.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="request-type-label">Libellé</Label>
        <Input
          id="request-type-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ex: Demande de supports campagne"
          required
          minLength={3}
          maxLength={ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS}
          disabled={pending}
        />
        <div className="flex justify-end">
          <FieldCharacterCount length={label.length} max={ADMIN_REQUEST_TYPE_LABEL_MAX_CHARS} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="request-type-description">Description (optionnel)</Label>
        <Textarea
          id="request-type-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS}
          disabled={pending}
        />
        <div className="flex justify-end">
          <FieldCharacterCount
            length={description.length}
            max={ADMIN_REQUEST_TYPE_DESCRIPTION_MAX_CHARS}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer le type"}
      </Button>
    </form>
  );
}
