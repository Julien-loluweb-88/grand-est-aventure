"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { DiscordLogoMark } from "@/components/oauth-brand-icons";
import { Button } from "@/components/ui/button";
import { isDiscordSignInConfigured } from "@/lib/discord-oauth-public";
import { cn } from "@/lib/utils";

type DiscordSignInButtonProps = {
  callbackURL: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function DiscordSignInButton({
  callbackURL,
  disabled,
  label = "Continuer avec Discord",
  className,
}: DiscordSignInButtonProps) {
  const [pending, setPending] = useState(false);

  if (!isDiscordSignInConfigured()) {
    return null;
  }

  const handleClick = async () => {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "discord",
      callbackURL,
    });
    setPending(false);
    if (error) {
      toast.error(error.message ?? "Connexion avec Discord impossible.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full gap-2.5 border-0 bg-[#5865F2] text-white hover:bg-[#4752C4] hover:text-white focus-visible:ring-white/40 dark:bg-[#5865F2] dark:hover:bg-[#4752C4]",
        className
      )}
      disabled={disabled || pending}
      onClick={handleClick}
    >
      <DiscordLogoMark />
      {pending ? "Redirection…" : label}
    </Button>
  );
}
