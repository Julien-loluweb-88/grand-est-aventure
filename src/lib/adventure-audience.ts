import { AdventureAudience } from "../../generated/prisma/client";

export const ADVENTURE_AUDIENCE_FORM_VALUES = [
  "PUBLIC",
  "DEMO",
  "DEVELOPMENT",
] as const;

export type AdventureAudienceFormValue =
  (typeof ADVENTURE_AUDIENCE_FORM_VALUES)[number];

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

export function adventureAudienceLabel(
  audience: AdventureAudience | AdventureAudienceFormValue
): string {
  switch (audience) {
    case AdventureAudience.DEMO:
    case "DEMO":
      return "Démo";
    case AdventureAudience.DEVELOPMENT:
    case "DEVELOPMENT":
      return "Développement";
    default:
      return "Publique";
  }
}

/** Hors catalogue joueur (`GET /api/game/adventures`, villes actives, etc.). */
export function isAdventureRestrictedAudience(
  audience: AdventureAudience
): boolean {
  return (
    audience === AdventureAudience.DEMO ||
    audience === AdventureAudience.DEVELOPMENT
  );
}
