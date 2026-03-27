"use client";

import { useState, type ComponentProps } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { submitAdventureCreationRequest } from "./request-adventure.action";

type Props = {
  triggerClassName?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

export function RequestNewAdventureDialog({
  triggerClassName,
  variant = "secondary",
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    setPending(true);
    const result = await submitAdventureCreationRequest(message);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Demande envoyée au super administrateur.");
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={triggerClassName}
        >
          <PaperPlaneTiltIcon className="mr-2 size-4" aria-hidden />
          Demander une nouvelle aventure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demande de création d&apos;aventure</DialogTitle>
          <DialogDescription>
            Votre demande sera transmise au super administrateur. Vous pouvez
            préciser la commune, le périmètre souhaité ou toute information utile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="request-message">Message (optionnel)</Label>
          <Textarea
            id="request-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex. : nouvelle chasse pour la commune de …"
            rows={5}
            maxLength={2000}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {message.length} / 2000 caractères
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" disabled={pending} onClick={() => void handleSubmit()}>
            {pending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
