"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getChangeEmailCallbackUrl } from "@/lib/public-app-url";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ChangeEmailForm() {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.changeEmail({
      newEmail: newEmail.trim().toLowerCase(),
      callbackURL: getChangeEmailCallbackUrl(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Impossible d’initier le changement d’e-mail.");
      return;
    }
    toast.success(
      "Si la nouvelle adresse est disponible, un e-mail de confirmation a été envoyé à votre adresse actuelle."
    );
    setNewEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-email">Nouvelle adresse e-mail</FieldLabel>
          <Input
            id="new-email"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <FieldDescription>
            Un lien de confirmation sera envoyé à l’adresse actuelle du compte. Le changement n’est
            effectif qu’après validation (et une seconde étape peut être demandée pour la nouvelle
            adresse selon la configuration Better Auth).
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi…" : "Demander le changement"}
      </Button>
    </form>
  );
}
