"use client";
import { User } from "../../../../../../../generated/prisma/browser";
import { unBanUser } from "./user.action";
import { DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";

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
} from "@/components/ui/dialog";

export function UnBanEditForm({ user }: { user: User }) {
  const caps = useAdminCapabilities();

  const handleUnBan = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      await unBanUser(user.id);
      toast.success("L'utilisateur a été débanni.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de débannir cet utilisateur."
      );
    }
  };

  const label = user.name ?? user.email ?? "cet utilisateur";

  if (!caps.user.ban) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        size="sm"
        className="border-green-600 text-green-700 hover:bg-green-50"
        allowed={false}
        denyReason="Vous ne pouvez pas débannir des utilisateurs."
      >
        Débannir l&apos;utilisateur
      </GuardedButton>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="border-green-600 text-green-700 hover:bg-green-50">
          Débannir l&apos;utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Débannir {label} ?
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
