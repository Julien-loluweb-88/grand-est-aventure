import "server-only";

import type { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { milestoneAdventuresEvaluator } from "@/lib/badges/evaluators/milestone-adventures";
import { milestoneKmEvaluator } from "@/lib/badges/evaluators/milestone-km";
import { specialTimeWindowEvaluator } from "@/lib/badges/evaluators/special-time-window";
import { performanceStreakEvaluator } from "@/lib/badges/evaluators/performance-streak";
import type { BadgeEvaluator } from "@/lib/badges/evaluators/types";

const EVALUATORS: BadgeEvaluator[] = [
  milestoneAdventuresEvaluator,
  milestoneKmEvaluator,
  specialTimeWindowEvaluator,
  performanceStreakEvaluator,
];

const registry = new Map<BadgeDefinitionKind, BadgeEvaluator>();
for (const evaluator of EVALUATORS) {
  for (const kind of evaluator.kinds) {
    registry.set(kind, evaluator);
  }
}

export function getBadgeEvaluator(
  kind: BadgeDefinitionKind
): BadgeEvaluator | undefined {
  return registry.get(kind);
}

/** Kinds évalués à la fin d’une aventure réussie (hors cron mensuel). */
export const FINISH_EVALUATOR_KINDS = [...registry.keys()] as BadgeDefinitionKind[];
