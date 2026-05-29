import "server-only";

import { prisma } from "@/lib/prisma";
import { UserAdventurePlaySessionStatus } from "@/lib/badges/prisma-enums";

/** Recalcul au plus toutes les 5 minutes (évite 3× COUNT(*) à chaque GET /api/game/home anonyme). */
const GLOBAL_CACHE_TTL_MS = 5 * 60 * 1000;

export type CommunityStatsScope = "global" | "user";

export type CommunityStats = {
  totalEnigmasSolved: number;
  totalAdventuresCompleted: number;
  totalBadgesEarned: number;
};

export type HomeCommunityStats = CommunityStats & {
  scope: CommunityStatsScope;
};

let globalCached: { stats: CommunityStats; expiresAt: number } | null = null;

/**
 * Règles de comptage **globales** (tous joueurs) :
 *
 * - **totalEnigmasSolved** : validations `stepKey` `enigma:*` (toutes parties).
 * - **totalAdventuresCompleted** : sessions `COMPLETED_SUCCESS` (chaque partie terminée compte).
 * - **totalBadgesEarned** : lignes `UserBadge`.
 */
async function countGlobalCommunityStatsFromDb(): Promise<CommunityStats> {
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

/**
 * Règles de comptage **utilisateur** (session valide sur `GET /api/game/home`) :
 *
 * - **totalEnigmasSolved** : validations `enigma:*` du joueur (même règle unicité par parcours).
 * - **totalAdventuresCompleted** : lignes `UserAdventures` avec `success: true` (parcours distincts terminés au moins une fois — aligné badges / progression).
 * - **totalBadgesEarned** : `UserBadge` du joueur (cohérent avec `GET /api/user/badges`).
 */
async function countUserCommunityStats(userId: string): Promise<CommunityStats> {
  const [totalEnigmasSolved, totalAdventuresCompleted, totalBadgesEarned] = await Promise.all([
    prisma.userAdventureStepValidation.count({
      where: { userId, stepKey: { startsWith: "enigma:" } },
    }),
    prisma.userAdventures.count({
      where: { userId, success: true },
    }),
    prisma.userBadge.count({
      where: { userId },
    }),
  ]);

  return {
    totalEnigmasSolved,
    totalAdventuresCompleted,
    totalBadgesEarned,
  };
}

async function getGlobalCommunityStats(): Promise<HomeCommunityStats> {
  const now = Date.now();
  if (globalCached && now < globalCached.expiresAt) {
    return { ...globalCached.stats, scope: "global" };
  }

  const stats = await countGlobalCommunityStatsFromDb();
  globalCached = { stats, expiresAt: now + GLOBAL_CACHE_TTL_MS };
  return { ...stats, scope: "global" };
}

/**
 * Stats barre d’accueil : globales si anonyme / session invalide, personnelles si connecté.
 *
 * @example Anonyme
 * `{ scope: "global", totalEnigmasSolved: 12847, totalAdventuresCompleted: 3421, totalBadgesEarned: 890 }`
 *
 * @example Connecté
 * `{ scope: "user", totalEnigmasSolved: 13, totalAdventuresCompleted: 6, totalBadgesEarned: 14 }`
 */
export async function getHomeCommunityStats(
  userId: string | null | undefined
): Promise<HomeCommunityStats> {
  if (!userId) {
    return getGlobalCommunityStats();
  }

  const stats = await countUserCommunityStats(userId);
  return { ...stats, scope: "user" };
}

/** @deprecated Préférer `getHomeCommunityStats`. Conservé si appel interne sans scope. */
export async function getCommunityStats(): Promise<CommunityStats> {
  const { scope: _scope, ...stats } = await getGlobalCommunityStats();
  return stats;
}
