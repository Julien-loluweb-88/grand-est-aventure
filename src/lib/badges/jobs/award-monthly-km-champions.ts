import "server-only";

import type { Prisma } from "../../../../generated/prisma/client";
import {
  BadgeDefinitionKind,
  UserAdventurePlaySessionStatus,
} from "@/lib/badges/prisma-enums";
import { awardBadgeOnce } from "@/lib/badges/award-once";
import { getParisYearMonth } from "@/lib/badges/paris-time";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

/** Km du mois : somme des distances des parcours distincts terminés avec succès dans le mois (Paris). */
async function kmByUserForParisMonth(
  tx: Tx,
  yearMonth: string
): Promise<Map<string, number>> {
  const sessions = await tx.userAdventurePlaySession.findMany({
    where: {
      status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS,
      endedAt: { not: null },
    },
    select: {
      userId: true,
      adventureId: true,
      endedAt: true,
    },
  });

  const adventureIds = new Set(sessions.map((s) => s.adventureId));
  const adventures = await tx.adventure.findMany({
    where: { id: { in: [...adventureIds] } },
    select: { id: true, distance: true },
  });
  const distanceByAdventure = new Map(
    adventures.map((a) => [a.id, typeof a.distance === "number" ? a.distance : 0])
  );

  const seen = new Set<string>();
  const kmByUser = new Map<string, number>();

  for (const s of sessions) {
    if (!s.endedAt || getParisYearMonth(s.endedAt) !== yearMonth) {
      continue;
    }
    const key = `${s.userId}:${s.adventureId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const km = distanceByAdventure.get(s.adventureId) ?? 0;
    kmByUser.set(s.userId, (kmByUser.get(s.userId) ?? 0) + km);
  }

  return kmByUser;
}

export type AwardMonthlyKmChampionsResult = {
  period: string;
  definitionId: string | null;
  winnerCount: number;
  awardedUserBadgeIds: string[];
};

/**
 * Attribue le badge `PERFORMANCE_MONTHLY_KM` aux ex æquo ayant le plus de km sur le mois donné.
 * @param yearMonth `YYYY-MM` (mois calendaire Paris). Par défaut : mois civil précédent.
 */
export async function awardMonthlyKmChampions(
  yearMonth?: string
): Promise<AwardMonthlyKmChampionsResult> {
  const period =
    yearMonth ??
    (() => {
      const now = new Date();
      const prev = new Date(now);
      prev.setUTCDate(1);
      prev.setUTCMonth(prev.getUTCMonth() - 1);
      return getParisYearMonth(prev);
    })();

  const definition = await prisma.badgeDefinition.findFirst({
    where: {
      kind: BadgeDefinitionKind.PERFORMANCE_MONTHLY_KM,
      adventureId: null,
    },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });

  if (!definition) {
    return { period, definitionId: null, winnerCount: 0, awardedUserBadgeIds: [] };
  }

  const kmByUser = await kmByUserForParisMonth(prisma, period);
  if (kmByUser.size === 0) {
    return { period, definitionId: definition.id, winnerCount: 0, awardedUserBadgeIds: [] };
  }

  const maxKm = Math.max(...kmByUser.values());
  if (maxKm <= 0) {
    return { period, definitionId: definition.id, winnerCount: 0, awardedUserBadgeIds: [] };
  }

  const winnerIds = [...kmByUser.entries()]
    .filter(([, km]) => km === maxKm)
    .map(([userId]) => userId);

  const awardedUserBadgeIds: string[] = [];
  for (const userId of winnerIds) {
    const id = await awardBadgeOnce(prisma, {
      userId,
      badgeDefinitionId: definition.id,
      context: { period },
    });
    if (id) {
      awardedUserBadgeIds.push(id);
    }
  }

  return {
    period,
    definitionId: definition.id,
    winnerCount: winnerIds.length,
    awardedUserBadgeIds,
  };
}
