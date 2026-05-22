"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getDeleteAccountCallbackUrl } from "@/lib/public-app-url";

/**
 * Confirme la suppression via `?deleteToken=` (lien e-mail → `/confirmer-suppression`).
 * Redirige vers `/au-revoir` après succès.
 */
export function DeleteAccountTokenHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("deleteToken");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    (async () => {
      const { error } = await authClient.deleteUser({
        token,
        callbackURL: getDeleteAccountCallbackUrl(),
      });
      if (error) {
        toast.error(
          error.message ??
            "Impossible de confirmer la suppression. Le lien est peut‑être expiré — redemandez un e-mail depuis les paramètres."
        );
        router.replace("/admin-game/dashboard/parametres#supprimer-compte");
        started.current = false;
        return;
      }
      await authClient.signOut();
      router.replace(getDeleteAccountCallbackUrl());
    })();
  }, [router, token]);

  return null;
}
