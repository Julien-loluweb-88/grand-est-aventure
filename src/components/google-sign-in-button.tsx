"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { GoogleLogoMark } from "@/components/oauth-brand-icons";
import { Button } from "@/components/ui/button";
import { isGoogleSignInConfigured } from "@/lib/google-oauth-public";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  callbackURL: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function GoogleSignInButton({
  callbackURL,
  disabled,
  label = "Continuer avec Google",
  className,
}: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);

  if (!isGoogleSignInConfigured()) {
    return null;
  }

  const handleClick = async () => {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Connexion avec Google impossible.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full gap-2.5 border-zinc-200 bg-white text-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900",
        className
      )}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      <GoogleLogoMark />
      {pending ? "Redirection…" : label}
    </Button>
  );
}
