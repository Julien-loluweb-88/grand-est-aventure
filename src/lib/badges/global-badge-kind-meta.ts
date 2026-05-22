/** Métadonnées admin / formulaire — sans import Prisma (compatible client). */

export const ADMIN_GLOBAL_BADGE_KIND_VALUES = [
  "MILESTONE_ADVENTURES",
  "MILESTONE_KM",
  "SPECIAL_TIME_WINDOW",
  "PERFORMANCE_STREAK",
  "PERFORMANCE_MONTHLY_KM",
] as const;

export type AdminGlobalBadgeKindValue = (typeof ADMIN_GLOBAL_BADGE_KIND_VALUES)[number];

export type GlobalBadgeKindMeta = {
  label: string;
  shortHelp: string;
  triggerLabel: string;
  needsThreshold: boolean;
  needsTimeWindow: boolean;
  needsStreakWeeks: boolean;
};

export const GLOBAL_BADGE_KIND_META: Record<AdminGlobalBadgeKindValue, GlobalBadgeKindMeta> = {
  MILESTONE_ADVENTURES: {
    label: "Palier — parcours terminés",
    shortHelp:
      "Nombre d’aventures distinctes terminées avec succès. Attribué automatiquement à la fin d’un parcours réussi.",
    triggerLabel: "Fin de parcours (réussi)",
    needsThreshold: true,
    needsTimeWindow: false,
    needsStreakWeeks: false,
  },
  MILESTONE_KM: {
    label: "Palier — kilomètres cumulés",
    shortHelp:
      "Somme des distances des parcours distincts réussis. Attribué à la fin d’un parcours réussi.",
    triggerLabel: "Fin de parcours (réussi)",
    needsThreshold: true,
    needsTimeWindow: false,
    needsStreakWeeks: false,
  },
  SPECIAL_TIME_WINDOW: {
    label: "Spécial — plage horaire",
    shortHelp:
      "Ex. explorateur nocturne : terminer un parcours entre 21h et 6h (heure de Paris). Attribué à la fin du parcours.",
    triggerLabel: "Fin de parcours (réussi)",
    needsThreshold: false,
    needsTimeWindow: true,
    needsStreakWeeks: false,
  },
  PERFORMANCE_STREAK: {
    label: "Performance — assiduité",
    shortHelp:
      "Au moins un parcours terminé avec succès par semaine (Paris), pendant N semaines consécutives.",
    triggerLabel: "Fin de parcours (réussi)",
    needsThreshold: false,
    needsTimeWindow: false,
    needsStreakWeeks: true,
  },
  PERFORMANCE_MONTHLY_KM: {
    label: "Performance — marcheur du mois",
    shortHelp:
      "Plus de km sur le mois civil précédent (Paris). Attribué par cron le 1er du mois. Permanent.",
    triggerLabel: "Cron (1er du mois)",
    needsThreshold: false,
    needsTimeWindow: false,
    needsStreakWeeks: false,
  },
};

export function isAdminGlobalBadgeKindValue(
  kind: string
): kind is AdminGlobalBadgeKindValue {
  return (ADMIN_GLOBAL_BADGE_KIND_VALUES as readonly string[]).includes(kind);
}
