"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Messages pour les codes renvoyés en query après OAuth / callback Better Auth. */
const KNOWN_AUTH_ERROR_TOASTS: Record<string, string> = {
  account_not_linked:
    "Ce compte n’a pas pu être relié au vôtre automatiquement. Connectez-vous avec la méthode utilisée à l’inscription (e-mail / réseau social), ou utilisez le même e-mail que sur votre compte.",
};

/**
 * À placer dans un `<Suspense>` : toast + nettoyage de `?error=…` pour les erreurs OAuth.
 * @see https://www.better-auth.com/docs/reference/errors/account_not_linked
 */
export function AuthCallbackQueryToasts() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (!errorCode) return;
    const normalized = errorCode.toLowerCase();
    const message = KNOWN_AUTH_ERROR_TOASTS[normalized];
    if (!message) return;
    toast.error(message);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("error");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [errorCode, pathname, router, searchParams]);

  return null;
}
