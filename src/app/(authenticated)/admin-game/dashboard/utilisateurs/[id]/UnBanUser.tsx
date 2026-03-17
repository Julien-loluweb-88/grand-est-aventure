"use client";
import { authClient } from "@/lib/auth";
import { User } from "../../../../../../../generated/prisma/browser";
import { unBanUser } from "./user.action";
import { DialogClose } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UnBanEditForm({ user }: { user: User }) {
  const handleUnBan = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    await unBanUser(user.id);
  };

  return (
    <Dialog>
      <DialogTrigger className="text-green-600 border border-black p-2">
        Débannir utilisateur
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Etes vous sur de vouloir débannir {user.name} ?
          </DialogTitle>
          <DialogDescription>
            Cette action permet de débannir un utilisateur.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="grid flex-1 gap-2"></div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            className="color-white bg-green-600 p-2"
            onClick={(e) => handleUnBan(e)}
          >
            Valider
          </Button>
          <DialogClose asChild>
            <Button type="button">Annuler</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
