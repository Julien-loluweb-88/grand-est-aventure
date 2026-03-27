"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const DEFAULT_DENY_MESSAGE =
  "Vous n'avez pas les droits suffisants pour cette action.";

type ButtonProps = React.ComponentProps<typeof Button>;

export type GuardedButtonProps = ButtonProps & {
  allowed: boolean;
  denyReason?: string;
};

/**
 * Bouton désactivé avec infobulle lorsque l'utilisateur n'a pas la permission.
 * Pour les boutons désactivés, le trigger tooltip est un span (comportement Radix).
 */
export function GuardedButton({
  allowed,
  denyReason = DEFAULT_DENY_MESSAGE,
  disabled,
  className,
  children,
  ...props
}: GuardedButtonProps) {
  if (!allowed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex",
              className?.includes("w-full") && "w-full"
            )}
          >
            <Button
              type="button"
              {...props}
              disabled
              aria-disabled
              className={cn("cursor-not-allowed opacity-60", className)}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-pretty">
          {denyReason}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button {...props} disabled={disabled} className={className}>
      {children}
    </Button>
  );
}
