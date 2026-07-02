import "server-only";

import type { Prisma } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Attribue un badge de façon idempotente (permanent, pas de mise à jour si déjà présent). */
export async function awardBadgeOnce(
  tx: Tx,
  input: {
    userId: string;
    badgeDefinitionId: string;
    context?: Prisma.InputJsonValue;
  }
): Promise<string | null> {
  const existing = await tx.userBadge.findUnique({
    where: {
      userId_badgeDefinitionId: {
        userId: input.userId,
        badgeDefinitionId: input.badgeDefinitionId,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return null;
  }
  const row = await tx.userBadge.create({
    data: {
      userId: input.userId,
      badgeDefinitionId: input.badgeDefinitionId,
      ...(input.context !== undefined ? { context: input.context } : {}),
    },
    select: { id: true },
  });
  return row.id;
}
