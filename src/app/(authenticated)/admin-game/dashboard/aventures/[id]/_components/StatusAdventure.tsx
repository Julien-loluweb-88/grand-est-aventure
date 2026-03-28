"use client"

import { toast } from "sonner";
import { statusAdventure } from "../_lib/adventure.action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StatusAdventure({ adventure }: { adventure: { id: string } }) {
  const router = useRouter();
  const caps = useAdminCapabilities();

  const handleStatus = async (status: boolean) => {
    try {
      await statusAdventure(adventure.id, status);
      toast.success("Statut mis à jour.")
      router.push("/admin-game/dashboard/aventures");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
    }
  };

  if (!caps.adventure.update) {
    return (
      <GuardedButton
        type="button"
        size="sm"
        allowed={false}
        denyReason="Vous ne pouvez pas modifier le statut d'une aventure."
      >
        Mettre en pause
      </GuardedButton>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Mettre en pause
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Modifier le statut
          </DialogTitle>
          <DialogDescription>
            Cette action permet de mettre en pause cette aventure.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="destructive"
          onClick={() => handleStatus(false)}>
          Pause
        </Button>
        <Button
          onClick={() => handleStatus(true)}>
          Active
        </Button>
      </DialogContent>
    </Dialog>

  )
}
