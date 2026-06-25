import "server-only";

import { AdventureAudience } from "../../generated/prisma/client";
import type { AdventureAudienceFormValue } from "@/lib/adventure-audience";

export function adventureAudienceFromForm(
  value: AdventureAudienceFormValue | string | undefined | null
): AdventureAudience {
  if (value === "DEMO") return AdventureAudience.DEMO;
  if (value === "DEVELOPMENT") return AdventureAudience.DEVELOPMENT;
  return AdventureAudience.PUBLIC;
}

export function adventureAudienceToForm(
  audience: AdventureAudience
): AdventureAudienceFormValue {
  if (audience === AdventureAudience.DEMO) return "DEMO";
  if (audience === AdventureAudience.DEVELOPMENT) return "DEVELOPMENT";
  return "PUBLIC";
}
