"use client";
import { useTransition, useState, useRef } from "react";
import { removeUser } from "./user.action";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function RemoveUserForm({ user }: { user: User }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const handleRemove = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (confirmText !== user.name) {
      toast.error("Le nom d'utilisateur ne correspond pas.");
      return;
    }

    const confirmed = confirm("Vous être sûr de vouloir le supprimer?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const result = await removeUser(user.id);
        if (result.success){
          toast.success(result.message);
          setConfirmText("");
          dialogRef.current?.close();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        toast.error("Échec de la suppression.");
      }
    });
  };

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger className="text-white bg-red-500 p-2">
        Supprimer cet utilisateur
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleRemove}>
          <DialogHeader>
            <DialogTitle>Supprimer {user.name}</DialogTitle>
            <DialogDescription>
              Veuillez saisir le nom de l&apos;utilisateur pour confirmer la
              suppression.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Input
              type="text"
              placeholder="le nom de l'utilisateur"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
            />
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="submit"
              className="bg-red-500 text-white p-2"
              disabled={confirmText !== user.name || isPending}
            >
              {isPending ? "Suppression..." : "Supprimer"}
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
