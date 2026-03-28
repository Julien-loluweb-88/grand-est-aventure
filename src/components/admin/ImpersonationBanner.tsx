"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type SessionWithImpersonation = {
  impersonatedBy?: string | null;
};

export function ImpersonationBanner() {
  const router = useRouter();
  const { data: sessionData, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);

  const innerSession = sessionData?.session as SessionWithImpersonation | undefined;
  const impersonatedBy = innerSession?.impersonatedBy;
  const displayName =
    sessionData?.user?.name?.trim() || sessionData?.user?.email || "cet utilisateur";

  if (isPending || !impersonatedBy) {
    return null;
  }

  const handleStop = async () => {
    setLoading(true);
    const { error } = await authClient.admin.stopImpersonating();
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Impossible de quitter le mode impersonation.");
      return;
    }
    toast.success("Vous êtes reconnecté avec votre compte administrateur.");
    router.refresh();
  };

  return (
    <div
      role="status"
      className="flex shrink-0 flex-col gap-2 border-b border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-pretty">
        <span className="font-medium">Mode impersonation.</span> Session et actions côté serveur
        pour <span className="font-medium">{displayName}</span> ; les menus du tableau de bord
        restent ceux de votre compte administrateur pour vous permettre de naviguer et de
        revenir.
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0"
        disabled={loading}
        onClick={handleStop}
      >
        {loading ? "Retour…" : "Revenir au compte admin"}
      </Button>
    </div>
  );
}
