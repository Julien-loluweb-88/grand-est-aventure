import "server-only";

import type { Prisma } from "../../../generated/prisma/client";
import { UserAdventurePlaySessionStatus } from "../../../generated/prisma/client";
import { getParisWeekKey } from "@/lib/badges/paris-time";

type Tx = Prisma.TransactionClient;

export type GlobalBadgeStats = {
  completedAdventures: number;
  totalKm: number;
  weekStreak: number;
};

export async function countDistinctCompletedAdventures(
  tx: Tx,
  userId: string
): Promise<number> {
  const grouped = await tx.userAdventures.groupBy({
    by: ["adventureId"],
    where: { userId, success: true },
    _count: true,
  });
  return grouped.length;
}

export async function sumKmCompletedAdventures(tx: Tx, userId: string): Promise<number> {
  const distinct = await tx.userAdventures.findMany({
    where: { userId, success: true },
    distinct: ["adventureId"],
    select: { adventureId: true },
  });
  if (distinct.length === 0) {
    return 0;
  }
  const adventures = await tx.adventure.findMany({
    where: { id: { in: distinct.map((d) => d.adventureId) } },
    select: { distance: true },
  });
  let sum = 0;
  for (const a of adventures) {
    const d = a.distance;
    if (typeof d === "number" && !Number.isNaN(d)) {
      sum += d;
    }
  }
  return sum;
}

/** Semaines consécutives (Paris, lundi→dimanche) avec ≥ 1 parcours terminé avec succès. */
export async function computeParisWeekStreak(tx: Tx, userId: string): Promise<number> {
  const sessions = await tx.userAdventurePlaySession.findMany({
    where: {
      userId,
      status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS,
      endedAt: { not: null },
    },
    select: { endedAt: true },
    orderBy: { endedAt: "desc" },
  });
  if (sessions.length === 0) {
    return 0;
  }

  const weekKeys = new Set<string>();
  for (const s of sessions) {
    if (s.endedAt) {
      weekKeys.add(getParisWeekKey(s.endedAt));
    }
  }
  if (weekKeys.size === 0) {
    return 0;
  }

  const sorted = [...weekKeys].sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseWeekKey(sorted[i - 1]!);
    const curr = parseWeekKey(sorted[i]!);
    const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
    if (Math.round(diffDays) === 7) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function parseWeekKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
}

export async function loadGlobalBadgeStats(tx: Tx, userId: string): Promise<GlobalBadgeStats> {
  const [completedAdventures, totalKm, weekStreak] = await Promise.all([
    countDistinctCompletedAdventures(tx, userId),
    sumKmCompletedAdventures(tx, userId),
    computeParisWeekStreak(tx, userId),
  ]);
  return { completedAdventures, totalKm, weekStreak };
}
