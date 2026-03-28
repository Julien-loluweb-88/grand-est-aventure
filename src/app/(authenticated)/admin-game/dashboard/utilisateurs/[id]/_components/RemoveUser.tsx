"use client";
import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeUser } from "../_lib/user.action";
import type { User } from "../../../../../../../../generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function RemoveUserForm({ user }: { user: User }) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const dialogRef = useRef<DialogCloseRef>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");
  const expectedConfirm = user.name ?? user.email ?? "";

  const handleRemove = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (confirmText !== expectedConfirm) {
      toast.error("Le texte saisi ne correspond pas au nom ou à l’e-mail affiché.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await removeUser(user.id);
        if (result.success){
          toast.success(result.message);
          setConfirmText("");
          dialogRef.current?.close();
          router.push("/admin-game/dashboard/utilisateurs");
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        toast.error("Échec de la suppression.");
      }
    });
  };

  if (!caps.user.delete) {
    return (
      <GuardedButton
        type="button"
        variant="destructive"
        size="sm"
        allowed={false}
        denyReason="Vous ne pouvez pas supprimer un utilisateur."
      >
        Supprimer le compte
      </GuardedButton>
    );
  }

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Supprimer le compte
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleRemove}>
          <DialogHeader>
            <DialogTitle>Supprimer {user.name ?? user.email}</DialogTitle>
            <DialogDescription>
              Saisissez exactement{" "}
              <span className="font-medium text-foreground">{expectedConfirm}</span> pour confirmer la
              suppression définitive.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Input
              type="text"
              placeholder={expectedConfirm || "Confirmation"}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="submit"
              className="bg-red-500 text-white p-2"
              disabled={confirmText !== expectedConfirm || isPending || !expectedConfirm}
            >
              {isPending ? "Suppression…" : "Supprimer"}
            </Button>

            <DialogClose asChild>
              <Button type="button">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
