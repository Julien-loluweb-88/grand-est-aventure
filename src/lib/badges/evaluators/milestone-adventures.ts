import "server-only";

import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { parseMilestoneAdventuresCriteria } from "@/lib/badges/criteria/parse-criteria";
import type { BadgeEvaluator } from "@/lib/badges/evaluators/types";

export const milestoneAdventuresEvaluator: BadgeEvaluator = {
  kinds: [BadgeDefinitionKind.MILESTONE_ADVENTURES],
  shouldAward(ctx, def) {
    const { minCompletedAdventures: min } = parseMilestoneAdventuresCriteria(def.criteria);
    return typeof min === "number" && ctx.stats.completedAdventures >= min;
  },
};
