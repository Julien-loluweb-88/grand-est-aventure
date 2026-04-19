"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { createAvatarAction } from "../_lib/avatar.action";

export function AvatarCreateForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const so = parseInt(sortOrder, 10);
      const res = await createAvatarAction({
        slug,
        name,
        sortOrder: Number.isFinite(so) ? so : 0,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Avatar créé.");
      router.push(`/admin-game/dashboard/avatars/${res.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="avatar-slug">Slug technique</FieldLabel>
        <Input
          id="avatar-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.trim().toLowerCase())}
          placeholder="ex. companion_fox"
          autoComplete="off"
          required
        />
        <p className="text-xs text-muted-foreground">
          Minuscules, chiffres, underscore ; 2–49 caractères ; commence par une lettre.
        </p>
      </Field>
      <Field>
        <FieldLabel htmlFor="avatar-name">Nom affiché</FieldLabel>
        <Input
          id="avatar-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Renard"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="avatar-order">Ordre dans les listes</FieldLabel>
        <Input
          id="avatar-order"
          type="number"
          min={0}
          max={9999}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer"}
      </Button>
    </form>
  );
}
