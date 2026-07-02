import "server-only";

import { BadgeDefinitionKind } from "@/lib/badges/prisma-enums";
import { parseTimeWindowCriteria } from "@/lib/badges/criteria/parse-criteria";
import { isInParisHourWindow } from "@/lib/badges/paris-time";
import type { BadgeEvaluator } from "@/lib/badges/evaluators/types";

export const specialTimeWindowEvaluator: BadgeEvaluator = {
  kinds: [BadgeDefinitionKind.SPECIAL_TIME_WINDOW],
  shouldAward(ctx, def) {
    if (!ctx.sessionEndedAt) {
      return false;
    }
    const { startHour, endHour, timezone } = parseTimeWindowCriteria(def.criteria);
    if (timezone !== "Europe/Paris") {
      return isInParisHourWindow(ctx.sessionEndedAt, startHour, endHour);
    }
    return isInParisHourWindow(ctx.sessionEndedAt, startHour, endHour);
  },
};
