import { Suspense } from "react";
import { DeleteAccountTokenHandler } from "@/components/delete-account-token-handler";

export default function ConfirmerSuppressionPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <Suspense fallback={null}>
        <DeleteAccountTokenHandler />
      </Suspense>
      <p className="text-sm text-[#281401]/70">Confirmation de la suppression en cours…</p>
      <p className="mt-2 text-xs text-[#281401]/50">
        Si rien ne se passe, le lien a peut‑être expiré. Redemandez la suppression depuis les
        paramètres de votre compte.
      </p>
    </div>
  );
}
