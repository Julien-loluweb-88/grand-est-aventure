"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { setUserPasswordAsAdmin } from "../_lib/user.action";
import type { User } from "../../../../../../../../generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogCloseRef,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SetUserPasswordForm({ user }: { user: User }) {
  const caps = useAdminCapabilities();
  const dialogRef = useRef<DialogCloseRef>(null);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    startTransition(async () => {
      const result = await setUserPasswordAsAdmin(user.id, password);
      if (result.success) {
        toast.success(result.message);
        setPassword("");
        dialogRef.current?.close();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!caps.user.setPassword) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        allowed={false}
        denyReason="Action réservée au super admin."
      >
        Définir le mot de passe
      </GuardedButton>
    );
  }

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Définir le mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau mot de passe</DialogTitle>
          <DialogDescription>
            Remplace le mot de passe e-mail / mot de passe pour {user.email}. L’utilisateur n’a pas
            besoin de l’ancien mot de passe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-set-password">Nouveau mot de passe</FieldLabel>
              <Input
                id="admin-set-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
