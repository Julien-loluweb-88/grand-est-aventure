"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  targetUserId: string;
  targetLabel: string;
  currentUserId: string | undefined;
};

export function ImpersonateUserButton({
  targetUserId,
  targetLabel,
  currentUserId,
}: Props) {
  const caps = useAdminCapabilities();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUserId != null && targetUserId === currentUserId;

  if (isSelf) {
    return null;
  }

  if (!caps.user.impersonate) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        allowed={false}
        denyReason="L’impersonation n’est pas autorisée pour votre rôle."
      >
        Se connecter en tant que cet utilisateur
      </GuardedButton>
    );
  }

  const handleImpersonate = async () => {
    setLoading(true);
    const { error } = await authClient.admin.impersonateUser({
      userId: targetUserId,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Impossible de démarrer l’impersonation.");
      return;
    }
    toast.success(`Vous êtes maintenant connecté en tant que ${targetLabel}.`);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Se connecter en tant que cet utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Impersonation</DialogTitle>
          <DialogDescription>
            Vous allez voir l’application avec le compte de <strong>{targetLabel}</strong>. Les
            droits effectifs sur les pages (proxy) suivent le rôle de ce compte : un utilisateur
            « standard » aura un accès limité au tableau de bord, tandis que votre barre latérale
            reste alignée sur votre rôle administrateur pour pouvoir naviguer et revenir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={loading} onClick={handleImpersonate}>
            {loading ? "Connexion…" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
