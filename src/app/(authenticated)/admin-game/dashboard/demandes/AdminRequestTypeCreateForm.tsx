"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
          maxLength={64}
          disabled={pending}
        />
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
          maxLength={120}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="request-type-description">Description (optionnel)</Label>
        <Textarea
          id="request-type-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer le type"}
      </Button>
    </form>
  );
}
