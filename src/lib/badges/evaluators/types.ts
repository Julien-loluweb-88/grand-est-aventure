import "server-only";

import type { Prisma } from "../../../../generated/prisma/client";
import type { BadgeDefinitionKind } from "../../../../generated/prisma/client";
import type { GlobalBadgeStats } from "@/lib/badges/load-global-badge-stats";

type Tx = Prisma.TransactionClient;

export type BadgeDefinitionEvalRow = {
  id: string;
  kind: BadgeDefinitionKind;
  criteria: Prisma.JsonValue | null;
  adventureId: string | null;
};

export type BadgeEvalContext = {
  tx: Tx;
  userId: string;
  adventureId: string;
  success: boolean;
  sessionEndedAt: Date | null;
  durationSeconds: number | null;
  stats: GlobalBadgeStats;
};

export type BadgeEvaluator = {
  readonly kinds: readonly BadgeDefinitionKind[];
  shouldAward(ctx: BadgeEvalContext, def: BadgeDefinitionEvalRow): Promise<boolean> | boolean;
};
