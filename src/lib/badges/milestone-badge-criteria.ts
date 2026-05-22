import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import {
  parseMilestoneAdventuresCriteria,
  parseMilestoneKmCriteria,
} from "@/lib/badges/criteria/parse-criteria";

/** Seuil numérique pour les paliers admin (parcours ou km). */
export function parseThresholdFromCriteria(
  kind: BadgeDefinitionKind,
  raw: unknown
): number {
  if (kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
    return parseMilestoneAdventuresCriteria(raw).minCompletedAdventures ?? 1;
  }
  if (kind === BadgeDefinitionKind.MILESTONE_KM) {
    return parseMilestoneKmCriteria(raw).minKmTotal ?? 1;
  }
  return 1;
}
