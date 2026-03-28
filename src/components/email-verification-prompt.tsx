"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function isEmailNotVerifiedAuthError(error: {
  code?: string;
  message?: string;
} | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "EMAIL_NOT_VERIFIED") return true;
  return error.message?.includes("vérifiée") ?? false;
}

type EmailVerificationPromptProps = {
  email: string;
  callbackURL: string;
  className?: string;
};

/** Après une connexion refusée (e-mail non vérifié) : explication + renvoi du lien. */
export function EmailVerificationPrompt({
  email,
  callbackURL,
  className,
}: EmailVerificationPromptProps) {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Impossible d’envoyer l’e-mail.");
      return;
    }
    toast.success("E-mail de vérification envoyé. Consultez votre boîte de réception.");
  };

  return (
    <div
      className={
        className ??
        "rounded-none border border-border bg-muted/40 p-4 text-sm text-foreground"
      }
    >
      <p className="font-medium">Vérifiez votre adresse e-mail</p>
      <p className="mt-2 text-muted-foreground">
        Vous devez confirmer votre e-mail avant de vous connecter. Ouvrez le lien reçu après
        inscription, ou demandez un nouvel e-mail ci-dessous.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        disabled={loading || !email}
        onClick={handleResend}
      >
        {loading ? "Envoi…" : "Renvoyer l’e-mail de vérification"}
      </Button>
    </div>
  );
}

/** À placer dans un `<Suspense>` (ex. page login / admin-game) : toasts + nettoyage de l’URL. */
export function EmailVerificationQueryToasts() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const verified = searchParams.get("verified");
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (verified === "1") {
      toast.success("Adresse e-mail confirmée. Vous pouvez vous connecter.");
      const next = new URLSearchParams(searchParams.toString());
      next.delete("verified");
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
      return;
    }

    if (errorCode === "INVALID_TOKEN" || errorCode === "TOKEN_EXPIRED") {
      toast.error(
        errorCode === "TOKEN_EXPIRED"
          ? "Le lien de vérification a expiré. Demandez un nouvel e-mail depuis la page de connexion."
          : "Ce lien de vérification n’est plus valide. Demandez un nouvel e-mail depuis la page de connexion."
      );
      const next = new URLSearchParams(searchParams.toString());
      next.delete("error");
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }
  }, [verified, errorCode, pathname, router, searchParams]);

  return null;
}
