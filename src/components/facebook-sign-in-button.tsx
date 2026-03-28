"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { FacebookLogoMark } from "@/components/oauth-brand-icons";
import { Button } from "@/components/ui/button";
import { isFacebookSignInConfigured } from "@/lib/facebook-oauth-public";
import { cn } from "@/lib/utils";

type FacebookSignInButtonProps = {
  callbackURL: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function FacebookSignInButton({
  callbackURL,
  disabled,
  label = "Continuer avec Facebook",
  className,
}: FacebookSignInButtonProps) {
  const [pending, setPending] = useState(false);

  if (!isFacebookSignInConfigured()) {
    return null;
  }

  const handleClick = async () => {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "facebook",
      callbackURL,
    });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Connexion avec Facebook impossible.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full gap-2.5 border-0 bg-[#1877F2] text-white hover:bg-[#166FE5] hover:text-white focus-visible:ring-white/40 dark:bg-[#1877F2] dark:hover:bg-[#166FE5]",
        className
      )}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      <FacebookLogoMark />
      {pending ? "Redirection…" : label}
    </Button>
  );
}
