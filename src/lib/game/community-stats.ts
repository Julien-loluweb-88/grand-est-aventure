import "server-only";

import { prisma } from "@/lib/prisma";
import { UserAdventurePlaySessionStatus } from "@/lib/badges/prisma-enums";

/** Recalcul au plus toutes les 5 minutes (évite 3× COUNT(*) à chaque GET /api/game/home). */
const CACHE_TTL_MS = 5 * 60 * 1000;

export type CommunityStats = {
  totalEnigmasSolved: number;
  totalAdventuresCompleted: number;
  totalBadgesEarned: number;
};

let cached: { stats: CommunityStats; expiresAt: number } | null = null;

/**
 * Règles de comptage (stats globales, tous joueurs) :
 *
 * - **totalEnigmasSolved** : `COUNT` sur `UserAdventureStepValidation` où `stepKey` commence par `enigma:`.
 *   Unique `(userId, adventureId, stepKey)` → rejouer la même énigme sur le **même** parcours ne recompte pas ;
 *   une énigme validée sur un **autre** parcours compte à nouveau (+1).
 *
 * - **totalAdventuresCompleted** : `COUNT` sur `UserAdventurePlaySession` en `COMPLETED_SUCCESS`
 *   (parcours terminé avec succès ; chaque partie compte, y compris un rejou).
 *
 * - **totalBadgesEarned** : `COUNT` sur `UserBadge` (badges effectivement attribués).
 */
async function countCommunityStatsFromDb(): Promise<CommunityStats> {
  const [totalEnigmasSolved, totalAdventuresCompleted, totalBadgesEarned] = await Promise.all([
    prisma.userAdventureStepValidation.count({
      where: { stepKey: { startsWith: "enigma:" } },
    }),
    prisma.userAdventurePlaySession.count({
      where: { status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS },
    }),
    prisma.userBadge.count(),
  ]);

  return {
    totalEnigmasSolved,
    totalAdventuresCompleted,
    totalBadgesEarned,
  };
}

/** Stats communauté : comptage direct en base, mis en cache mémoire (TTL 5 min). */
export async function getCommunityStats(): Promise<CommunityStats> {
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.stats;
  }

  const stats = await countCommunityStatsFromDb();
  cached = { stats, expiresAt: now + CACHE_TTL_MS };
  return stats;
}
