import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import {
  ADMIN_GLOBAL_BADGE_KIND_VALUES,
  GLOBAL_BADGE_KIND_META,
  isAdminGlobalBadgeKindValue,
  type AdminGlobalBadgeKindValue,
} from "@/lib/badges/global-badge-kind-meta";
import {
  parseMilestoneAdventuresCriteria,
  parseMilestoneKmCriteria,
  parseStreakCriteria,
  parseTimeWindowCriteria,
} from "@/lib/badges/criteria/parse-criteria";

export {
  ADMIN_GLOBAL_BADGE_KIND_VALUES as ADMIN_GLOBAL_BADGE_KINDS,
  GLOBAL_BADGE_KIND_META,
  type AdminGlobalBadgeKindValue as AdminGlobalBadgeKind,
};

export function isAdminGlobalBadgeKind(
  kind: BadgeDefinitionKind
): kind is AdminGlobalBadgeKindValue {
  return isAdminGlobalBadgeKindValue(kind);
}

export function formatGlobalBadgeRuleSummary(
  kind: BadgeDefinitionKind,
  criteria: unknown
): string {
  if (kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    const n = parseMilestoneAdventuresCriteria(criteria).minCompletedAdventures ?? 1;
    return `≥ ${n} parcours distinct(s) réussi(s)`;
  }
  if (kind === BadgeDefinitionKind.MILESTONE_KM) {
    const n = parseMilestoneKmCriteria(criteria).minKmTotal ?? 1;
    return `≥ ${n} km cumulés`;
  }
  if (kind === BadgeDefinitionKind.SPECIAL_TIME_WINDOW) {
    const { startHour, endHour } = parseTimeWindowCriteria(criteria);
    return `Fin entre ${startHour}h et ${endHour}h (Paris)`;
  }
  if (kind === BadgeDefinitionKind.PERFORMANCE_STREAK) {
    const { minWeeksConsecutive } = parseStreakCriteria(criteria);
    return `${minWeeksConsecutive} semaine(s) consécutive(s) avec ≥ 1 parcours`;
  }
  if (kind === BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM) {
    return `Max km sur le mois civil précédent (cron)`;
  }
  return "—";
}

export function buildCriteriaForAdminKind(
  kind: AdminGlobalBadgeKindValue,
  input: {
    threshold?: number;
    startHour?: number;
    endHour?: number;
    streakWeeks?: number;
  }
): Prisma.InputJsonValue {
  switch (kind) {
    case "MILESTONE_ADVENTURES":
      return { minCompletedAdventures: input.threshold ?? 1 };
    case "MILESTONE_KM":
      return { minKmTotal: input.threshold ?? 1 };
    case "SPECIAL_TIME_WINDOW":
      return {
        startHour: input.startHour ?? 21,
        endHour: input.endHour ?? 6,
        timezone: "Europe/Paris",
      };
    case "PERFORMANCE_STREAK":
      return {
        minWeeksConsecutive: input.streakWeeks ?? 4,
        minCompletionsPerWeek: 1,
      };
    case "PERFORMANCE_MONTHLY_KM":
      return {};
    default:
      return {};
  }
}
