import type { AdminGlobalBadgeKindValue } from "@/lib/badges/global-badge-kind-meta";
import {
  parseMilestoneAdventuresCriteria,
  parseMilestoneKmCriteria,
  parseStreakCriteria,
  parseTimeWindowCriteria,
} from "@/lib/badges/criteria/parse-criteria";

export type GlobalBadgeFormCriteriaDefaults = {
  threshold?: number;
  startHour?: number;
  endHour?: number;
  streakWeeks?: number;
};

export function criteriaToFormDefaults(
  kind: AdminGlobalBadgeKindValue,
  criteria: unknown
): GlobalBadgeFormCriteriaDefaults {
  switch (kind) {
    case "MILESTONE_ADVENTURES":
      return {
        threshold: parseMilestoneAdventuresCriteria(criteria).minCompletedAdventures ?? 1,
      };
    case "MILESTONE_KM":
      return { threshold: parseMilestoneKmCriteria(criteria).minKmTotal ?? 1 };
    case "SPECIAL_TIME_WINDOW": {
      const t = parseTimeWindowCriteria(criteria);
      return { startHour: t.startHour, endHour: t.endHour };
    }
    case "PERFORMANCE_STREAK":
      return {
        streakWeeks: parseStreakCriteria(criteria).minWeeksConsecutive,
      };
    default:
      return {};
  }
}
