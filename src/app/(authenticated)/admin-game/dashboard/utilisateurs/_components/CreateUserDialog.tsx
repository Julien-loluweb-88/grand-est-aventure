"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUserAsAdmin } from "../_lib/user-create.action";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateUserDialog() {
  const caps = useAdminCapabilities();
  const router = useRouter();
  const dialogRef = useRef<DialogCloseRef>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "myCustomRole">("user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    startTransition(async () => {
      const result = await createUserAsAdmin({
        name,
        email,
        password,
        role,
      });
      if (result.ok) {
        toast.success("Utilisateur créé.");
        setName("");
        setEmail("");
        setPassword("");
        setRole("user");
        dialogRef.current?.close();
        router.push(`/admin-game/dashboard/utilisateurs/${result.userId}`);
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!caps.user.create) {
    return (
      <GuardedButton
        type="button"
        variant="default"
        allowed={false}
        denyReason="Création de compte réservée au super admin."
      >
        Créer un utilisateur
      </GuardedButton>
    );
  }

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger asChild>
        <Button type="button">Créer un utilisateur</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Compte e-mail / mot de passe, e-mail marqué comme vérifié pour une connexion immédiate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-user-name">Nom</FieldLabel>
              <Input
                id="create-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-user-email">E-mail</FieldLabel>
              <Input
                id="create-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-user-password">Mot de passe</FieldLabel>
              <Input
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <Field>
              <FieldLabel>Rôle</FieldLabel>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "user" | "admin" | "myCustomRole")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Admin (client)</SelectItem>
                  <SelectItem value="myCustomRole">Rôle personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
