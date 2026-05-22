import "server-only";

import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { parseMilestoneKmCriteria } from "@/lib/badges/criteria/parse-criteria";
import type { BadgeEvaluator } from "@/lib/badges/evaluators/types";

export const milestoneKmEvaluator: BadgeEvaluator = {
  kinds: [BadgeDefinitionKind.MILESTONE_KM],
  shouldAward(ctx, def) {
    const { minKmTotal: min } = parseMilestoneKmCriteria(def.criteria);
    return typeof min === "number" && ctx.stats.totalKm >= min;
  },
};
