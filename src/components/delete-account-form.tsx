"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getDeleteAccountCallbackUrl } from "@/lib/public-app-url";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogCloseRef,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type DeleteAccountFormProps = {
  userEmail: string;
};

export function DeleteAccountForm({ userEmail }: DeleteAccountFormProps) {
  const router = useRouter();
  const dialogRef = useRef<DialogCloseRef>(null);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const expectedConfirm = userEmail.trim().toLowerCase();

  const resetDialog = useCallback(() => {
    setPassword("");
    setConfirmText("");
  }, []);

  const handleDelete = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (confirmText.trim().toLowerCase() !== expectedConfirm) {
        toast.error("Saisissez exactement l’adresse e-mail du compte pour confirmer.");
        return;
      }

      startTransition(async () => {
        const trimmedPassword = password.trim();
        const { error } = await authClient.deleteUser(
          trimmedPassword
            ? { password: trimmedPassword, callbackURL: getDeleteAccountCallbackUrl() }
            : { callbackURL: getDeleteAccountCallbackUrl() }
        );

        if (error) {
          const msg = error.message ?? "Impossible de supprimer le compte.";
          if (
            msg.toLowerCase().includes("password") ||
            msg.toLowerCase().includes("mot de passe") ||
            error.code === "INVALID_PASSWORD"
          ) {
            toast.error(
              "Mot de passe incorrect ou requis. Saisissez votre mot de passe, ou utilisez le lien envoyé par e-mail (comptes Google / Facebook / Discord)."
            );
          } else {
            toast.error(msg);
          }
          return;
        }

        const sessionAfter = await authClient.getSession();
        if (sessionAfter.data?.user) {
          toast.success(
            "Un e-mail de confirmation a été envoyé. Ouvrez le lien (site ou application mobile) pour finaliser la suppression."
          );
          dialogRef.current?.close();
          resetDialog();
          return;
        }

        await authClient.signOut();
        toast.success("Votre compte a été supprimé.");
        dialogRef.current?.close();
        resetDialog();
        router.replace(getDeleteAccountCallbackUrl());
      });
    },
    [confirmText, expectedConfirm, password, resetDialog, router]
  );

  return (
    <Dialog
      ref={dialogRef}
      onOpenChange={(open) => {
        if (!open) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Supprimer mon compte
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleDelete}>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement votre compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible (progression, badges, préférences). Pour confirmer,
              saisissez votre adresse e-mail :{" "}
              <span className="font-medium text-foreground">{userEmail}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="delete-confirm-email">Confirmer l’e-mail</FieldLabel>
                <Input
                  id="delete-confirm-email"
                  type="email"
                  autoComplete="off"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={userEmail}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="delete-password">Mot de passe (si compte e-mail)</FieldLabel>
                <Input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FieldDescription>
                  Obligatoire si vous vous connectez avec un mot de passe. Pour Google / Facebook /
                  Discord sans mot de passe, laissez vide : un e-mail de confirmation sera envoyé
                  (lien site ou application mobile).
                </FieldDescription>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="sm:justify-start gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={
                isPending ||
                confirmText.trim().toLowerCase() !== expectedConfirm ||
                !expectedConfirm
              }
            >
              {isPending ? "Traitement…" : "Supprimer définitivement"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
