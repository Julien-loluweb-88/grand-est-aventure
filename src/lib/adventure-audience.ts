/** Valeurs formulaire / API admin — safe client & serveur (sans import Prisma). */

export const ADVENTURE_AUDIENCE_FORM_VALUES = [
  "PUBLIC",
  "DEMO",
  "DEVELOPMENT",
] as const;

export type AdventureAudienceFormValue =
  (typeof ADVENTURE_AUDIENCE_FORM_VALUES)[number];

export function adventureAudienceLabel(
  audience: AdventureAudienceFormValue | string
): string {
  switch (audience) {
    case "DEMO":
      return "Démo";
    case "DEVELOPMENT":
      return "Développement";
    default:
      return "Publique";
  }
}

/** Hors catalogue joueur (`GET /api/game/adventures`, villes actives, etc.). */
export function isAdventureRestrictedAudience(
  audience: AdventureAudienceFormValue
): boolean {
  return audience === "DEMO" || audience === "DEVELOPMENT";
}
