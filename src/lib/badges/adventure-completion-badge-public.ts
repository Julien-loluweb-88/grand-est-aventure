import { prisma } from "@/lib/prisma";

/** Badge virtuel « complétion d’aventure » exposé aux clients mobile (sans secrets). */
export type AdventureCompletionBadgePublic = {
  badgeDefinitionId: string;
  title: string;
  imageUrl: string | null;
};

/** Badge déjà acquis par le joueur pour cette aventure (rejeu / fallback écran victoire). */
export type PlayerCompletionBadgePublic = AdventureCompletionBadgePublic & {
  userBadgeId: string;
  earnedAt: string;
};

export function serializeAdventureCompletionBadge(
  virtualBadge: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null
): AdventureCompletionBadgePublic | null {
  if (!virtualBadge) {
    return null;
  }
  return {
    badgeDefinitionId: virtualBadge.id,
    title: virtualBadge.title,
    imageUrl: virtualBadge.imageUrl,
  };
}

export async function loadPlayerCompletionBadgeForAdventure(
  userId: string,
  badgeDefinitionId: string | undefined
): Promise<PlayerCompletionBadgePublic | null> {
  if (!badgeDefinitionId) {
    return null;
  }

  const row = await prisma.userBadge.findUnique({
    where: {
      userId_badgeDefinitionId: {
        userId,
        badgeDefinitionId,
      },
    },
    select: {
      id: true,
      earnedAt: true,
      badgeDefinition: {
        select: { id: true, title: true, imageUrl: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    userBadgeId: row.id,
    badgeDefinitionId: row.badgeDefinition.id,
    title: row.badgeDefinition.title,
    imageUrl: row.badgeDefinition.imageUrl,
    earnedAt: row.earnedAt.toISOString(),
  };
}
