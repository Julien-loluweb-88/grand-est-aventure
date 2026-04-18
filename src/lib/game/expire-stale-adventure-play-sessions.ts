import "server-only";

import { prisma } from "@/lib/prisma";
import { UserAdventurePlaySessionStatus } from "@/lib/badges/prisma-enums";

const DEFAULT_MAX_AGE_DAYS = 30;

/**
 * Clôture les sessions encore « en cours » depuis trop longtemps (abandon probable).
 * Ne compte pas dans les moyennes de durée réelle.
 */
export async function expireStaleAdventurePlaySessions(
  maxAgeDays: number = DEFAULT_MAX_AGE_DAYS
): Promise<{ closed: number }> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - maxAgeDays);

  const endedAt = new Date();
  const result = await prisma.userAdventurePlaySession.updateMany({
    where: {
      status: UserAdventurePlaySessionStatus.IN_PROGRESS,
      startedAt: { lt: cutoff },
    },
    data: {
      status: UserAdventurePlaySessionStatus.ABANDONED,
      endedAt,
      durationSeconds: null,
    },
  });

  return { closed: result.count };
}
