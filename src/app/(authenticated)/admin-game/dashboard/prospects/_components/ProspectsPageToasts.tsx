"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ProspectsPageToasts() {
  const params = useSearchParams();

  useEffect(() => {
    const action = params.get("action");
    const message = params.get("message");
    const importStatus = params.get("import");

    if (action === "error" && message) {
      toast.error(message);
    }
    if (action === "ok" && message) {
      toast.success(message);
    }
    if (importStatus === "error" && message) {
      toast.error(message);
    }
    if (importStatus === "ok") {
      const created = params.get("created") ?? "0";
      const enriched = params.get("enriched") ?? "0";
      const total = params.get("total") ?? "0";
      toast.success(
        `Import terminé : ${created} créé(s), ${enriched} coordonnées mises à jour (${total} au total).`
      );
    }
  }, [params]);

  return null;
}
