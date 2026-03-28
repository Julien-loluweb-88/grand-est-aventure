"use client";

import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
        toast.error("La confirmation ne correspond pas au nouveau mot de passe.");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      setLoading(true);
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message ?? "Impossible de changer le mot de passe.");
        return;
      }
      toast.success("Mot de passe mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    [confirmPassword, currentPassword, newPassword, revokeOtherSessions]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current-password">Mot de passe actuel</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <FieldDescription>Au moins 8 caractères.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-new-password">Confirmer le nouveau mot de passe</FieldLabel>
          <Input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field className="flex flex-row items-center gap-2 space-y-0">
          <Checkbox
            id="revoke-sessions"
            checked={revokeOtherSessions}
            onCheckedChange={(v) => setRevokeOtherSessions(v === true)}
          />
          <FieldLabel htmlFor="revoke-sessions" className="font-normal leading-snug">
            Déconnecter les autres appareils (révoquer les autres sessions)
          </FieldLabel>
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
      </Button>
    </form>
  );
}
