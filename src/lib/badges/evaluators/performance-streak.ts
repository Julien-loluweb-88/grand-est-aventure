import "server-only";

import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { parseStreakCriteria } from "@/lib/badges/criteria/parse-criteria";
import type { BadgeEvaluator } from "@/lib/badges/evaluators/types";

export const performanceStreakEvaluator: BadgeEvaluator = {
  kinds: [BadgeDefinitionKind.PERFORMANCE_STREAK],
  shouldAward(ctx, def) {
    const { minWeeksConsecutive } = parseStreakCriteria(def.criteria);
    return ctx.stats.weekStreak >= minWeeksConsecutive;
  },
};
