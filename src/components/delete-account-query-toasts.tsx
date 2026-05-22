"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Toast après redirection post-suppression (`?deleted=1` sur `/admin-game`). */
export function DeleteAccountQueryToasts() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const deleted = searchParams.get("deleted");

  useEffect(() => {
    if (deleted !== "1") return;
    toast.success("Votre compte a bien été supprimé. À bientôt sur Balad'indice.");
    const next = new URLSearchParams(searchParams.toString());
    next.delete("deleted");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [deleted, pathname, router, searchParams]);

  return null;
}
