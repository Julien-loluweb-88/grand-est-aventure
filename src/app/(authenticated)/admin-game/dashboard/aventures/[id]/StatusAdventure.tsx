"use client"

import { toast } from "sonner";
import { statusAdventure} from "./adventure.action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Adventure } from "../../../../../../../generated/prisma/browser";

export function StatusAdventure ({adventure}: {adventure: Adventure}){
const router = useRouter();

  const handleStatus = async (status: boolean) => {
    try{
      await statusAdventure(adventure.id, status);
      toast.success("Statut mis à jour")
      router.push("/admin-game/dashboard/aventures");
    } catch(error) {
      toast.error("Erreur lors de la mis à jour");
    }
  };

  return(
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
