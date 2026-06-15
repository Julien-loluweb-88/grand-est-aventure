import "server-only";

import type { BadgeDefinitionKind } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Badge virtuel nouvellement attribué à la finalisation (affichage app). */
export type AwardedBadgeDetail = {
  userBadgeId: string;
  badgeDefinitionId: string;
  title: string;
  imageUrl: string | null;
  kind: BadgeDefinitionKind;
  adventureId: string | null;
};

export async function loadAwardedBadgeDetails(
  userBadgeIds: string[]
): Promise<AwardedBadgeDetail[]> {
  if (userBadgeIds.length === 0) {
    return [];
  }

  const rows = await prisma.userBadge.findMany({
    where: { id: { in: userBadgeIds } },
    select: {
      id: true,
      badgeDefinition: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          kind: true,
          adventureId: true,
        },
      },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r] as const));
  const details: AwardedBadgeDetail[] = [];

  for (const id of userBadgeIds) {
    const row = byId.get(id);
    if (!row) {
      continue;
    }
    details.push({
      userBadgeId: row.id,
      badgeDefinitionId: row.badgeDefinition.id,
      title: row.badgeDefinition.title,
      imageUrl: row.badgeDefinition.imageUrl,
      kind: row.badgeDefinition.kind,
      adventureId: row.badgeDefinition.adventureId,
    });
  }

  return details;
}

/** Payload JSON commun après finalisation réussie (`validate-treasure` / `validate-finish`). */
export async function buildGameFinishSuccessPayload(input: {
  stepKey: string;
  awardedUserBadgeIds: string[];
  userId: string;
  adventureId: string;
  message: string;
}) {
  const [awardedBadges, userAdventure] = await Promise.all([
    loadAwardedBadgeDetails(input.awardedUserBadgeIds),
    prisma.userAdventures.findFirst({
      where: { userId: input.userId, adventureId: input.adventureId },
      select: { giftNumber: true },
    }),
  ]);

  return {
    ok: true as const,
    stepKey: input.stepKey,
    awardedUserBadgeIds: input.awardedUserBadgeIds,
    awardedBadges,
    giftNumber: userAdventure?.giftNumber ?? 0,
    message: input.message,
  };
}
