"use client"
import { useState, useRef, useTransition } from "react";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RemoveAdventure } from "./adventure.action"
import { Adventure } from "../../../../../../../generated/prisma/browser";
import { useRouter } from "next/navigation";

export function RemoveAdventureForm({adventure}: {adventure: Adventure}){
    const router = useRouter();
    const dialogRef = useRef<DialogCloseRef>(null);
    const [isPending, startTransition] = useTransition();
    const [confirmText, setConfirmText] = useState("");
    const expectedConfirm = adventure.name ?? "";

    const handleRemove = async(e: React.SyntheticEvent) => {
        e.preventDefault();
        if (confirmText !== expectedConfirm) {
      toast.error("Le texte saisi ne correspond pas au nom affiché.");
      return;
    }

    startTransition(async () => {
          try {
            const result = await RemoveAdventure(adventure.id);
            if (result.success){
              toast.success(result.message);
              setConfirmText("");
              dialogRef.current?.close();
              router.push("/admin-game/dashboard/aventures");
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
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Supprimer l&apos;aventure
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleRemove}>
          <DialogHeader>
            <DialogTitle>Supprimer {adventure.name}</DialogTitle>
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
              {isPending ? "Suppression..." : "Supprimer"}
            </Button>

            <DialogClose asChild>
              <Button type="button">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    )
}