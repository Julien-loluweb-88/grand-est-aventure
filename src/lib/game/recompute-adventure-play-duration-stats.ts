import "server-only";

import { prisma } from "@/lib/prisma";
import { UserAdventurePlaySessionStatus } from "@/lib/badges/prisma-enums";
import { expireStaleAdventurePlaySessions } from "@/lib/game/expire-stale-adventure-play-sessions";

/** Nombre minimum de parties terminées avec succès pour publier une moyenne (évite le bruit). */
const MIN_SAMPLES_FOR_AVERAGE = 5;

export type RecomputeAdventurePlayDurationStatsResult = {
  stalePlaySessionsClosed: number;
  adventuresUpdated: number;
};

/**
 * Recalcule pour chaque aventure la durée moyenne de jeu (sessions terminées avec succès).
 * - Expire d’abord les sessions `IN_PROGRESS` trop anciennes.
 * - Remet à zéro les agrégats sur **toutes** les aventures, puis réécrit depuis les données
 *   (évite les moyennes « figées » si les sessions disparaissent).
 * Idempotent : peut être appelée quotidiennement par le cron.
 */
export async function recomputeAdventurePlayDurationStats(): Promise<RecomputeAdventurePlayDurationStatsResult> {
  const stale = await expireStaleAdventurePlaySessions();

  const now = new Date();
  await prisma.adventure.updateMany({
    data: {
      averagePlayDurationSeconds: null,
      playDurationSampleCount: 0,
      playDurationStatsUpdatedAt: now,
    },
  });

  const grouped = await prisma.userAdventurePlaySession.groupBy({
    by: ["adventureId"],
    where: {
      status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS,
      durationSeconds: { not: null },
    },
    _avg: { durationSeconds: true },
    _count: { _all: true },
  });

  let adventuresUpdated = 0;

  for (const row of grouped) {
    const sampleCount = row._count._all;
    const avg = row._avg.durationSeconds;
    const averageSeconds =
      sampleCount >= MIN_SAMPLES_FOR_AVERAGE && avg != null && Number.isFinite(avg)
        ? Math.round(avg)
        : null;

    await prisma.adventure.update({
      where: { id: row.adventureId },
      data: {
        averagePlayDurationSeconds: averageSeconds,
        playDurationSampleCount: sampleCount,
        playDurationStatsUpdatedAt: now,
      },
    });
    adventuresUpdated += 1;
  }

  return { stalePlaySessionsClosed: stale.closed, adventuresUpdated };
}
