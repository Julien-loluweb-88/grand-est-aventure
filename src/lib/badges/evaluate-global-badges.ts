import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { BadgeDefinitionKind } from "../../../generated/prisma/client";
import { awardBadgeOnce } from "@/lib/badges/award-once";
import { FINISH_EVALUATOR_KINDS, getBadgeEvaluator } from "@/lib/badges/evaluators/registry";
import type { BadgeEvalContext } from "@/lib/badges/evaluators/types";
import { loadGlobalBadgeStats } from "@/lib/badges/load-global-badge-stats";

type Tx = Prisma.TransactionClient;

export async function evaluateGlobalBadgesOnFinish(
  tx: Tx,
  input: {
    userId: string;
    adventureId: string;
    success: boolean;
    sessionEndedAt: Date | null;
    durationSeconds: number | null;
  }
): Promise<string[]> {
  if (!input.success) {
    return [];
  }

  const stats = await loadGlobalBadgeStats(tx, input.userId);
  const ctx: BadgeEvalContext = {
    tx,
    userId: input.userId,
    adventureId: input.adventureId,
    success: input.success,
    sessionEndedAt: input.sessionEndedAt,
    durationSeconds: input.durationSeconds,
    stats,
  };

  const definitions = await tx.badgeDefinition.findMany({
    where: {
      kind: { in: FINISH_EVALUATOR_KINDS },
      adventureId: null,
    },
    select: { id: true, kind: true, criteria: true, adventureId: true },
  });

  const awardedIds: string[] = [];
  for (const def of definitions) {
    const evaluator = getBadgeEvaluator(def.kind);
    if (!evaluator) {
      continue;
    }
    const ok = await evaluator.shouldAward(ctx, def);
    if (!ok) {
      continue;
    }
    const id = await awardBadgeOnce(tx, {
      userId: input.userId,
      badgeDefinitionId: def.id,
    });
    if (id) {
      awardedIds.push(id);
    }
  }

  return awardedIds;
}

/** Kinds gérés uniquement par jobs planifiés (pas à la fin de parcours). */
export const CRON_ONLY_BADGE_KINDS = [
  BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM,
] as const;
