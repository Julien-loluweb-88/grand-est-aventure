import type { Prisma } from "../../../generated/prisma/client";
import {
  AdventureBadgeInstanceStatus,
} from "../../../generated/prisma/client";
import { UserAdventurePlaySessionStatus } from "../../../generated/prisma/client";
import { evaluateGlobalBadgesOnFinish } from "@/lib/badges/evaluate-global-badges";
import { awardBadgeOnce } from "@/lib/badges/award-once";
import { assertCanFinishWithSuccess } from "@/lib/game/server-adventure-progress";
import { closeActivePlaySession } from "@/lib/game/user-adventure-play-session";

type Tx = Prisma.TransactionClient;

export async function processGameFinish(
  tx: Tx,
  input: {
    adventureId: string;
    userId: string;
    success: boolean;
    /** Utilisé seulement s’il n’y a pas de stock physique géré. */
    /** Saisi au code coffre (`validate-treasure`, corps `giftNumber`). */
    clientGiftNumber?: number;
  }
): Promise<{ awardedUserBadgeIds: string[] }> {
  const { adventureId, userId, success } = input;
  let giftNumber = input.clientGiftNumber ?? 0;

  const existing = await tx.userAdventures.findFirst({
    where: { adventureId, userId },
  });

  if (success && !existing?.success) {
    await assertCanFinishWithSuccess(tx, userId, adventureId);
  }

  if (success) {
    const adventure = await tx.adventure.findUnique({
      where: { id: adventureId },
      select: { physicalBadgeStockCount: true },
    });
    const stock = adventure?.physicalBadgeStockCount ?? 0;
    if (stock > 0) {
      const instance = await tx.adventureBadgeInstance.findFirst({
        where: {
          adventureId,
          status: AdventureBadgeInstanceStatus.AVAILABLE,
        },
        orderBy: { giftNumber: "asc" },
      });
      if (instance) {
        await tx.adventureBadgeInstance.update({
          where: { id: instance.id },
          data: {
            status: AdventureBadgeInstanceStatus.CLAIMED,
            claimedByUserId: userId,
            claimedAt: new Date(),
          },
        });
        giftNumber = instance.giftNumber;
      }
    }
  }

  if (existing) {
    await tx.userAdventures.update({
      where: { id: existing.id },
      data: { success, giftNumber },
    });
  } else {
    await tx.userAdventures.create({
      data: { adventureId, userId, success, giftNumber },
    });
  }

  await closeActivePlaySession(tx, userId, adventureId, { success });

  const awardedUserBadgeIds: string[] = [];

  if (!success) {
    return { awardedUserBadgeIds };
  }

  const adventureDef = await tx.badgeDefinition.findUnique({
    where: { adventureId },
  });
  if (adventureDef) {
    const id = await awardBadgeOnce(tx, {
      userId,
      badgeDefinitionId: adventureDef.id,
    });
    if (id) {
      awardedUserBadgeIds.push(id);
    }
  }

  const closedSession = await tx.userAdventurePlaySession.findFirst({
    where: {
      userId,
      adventureId,
      status: UserAdventurePlaySessionStatus.COMPLETED_SUCCESS,
    },
    orderBy: { endedAt: "desc" },
    select: { endedAt: true, durationSeconds: true },
  });

  const globalAwarded = await evaluateGlobalBadgesOnFinish(tx, {
    userId,
    adventureId,
    success: true,
    sessionEndedAt: closedSession?.endedAt ?? new Date(),
    durationSeconds: closedSession?.durationSeconds ?? null,
  });
  awardedUserBadgeIds.push(...globalAwarded);

  return { awardedUserBadgeIds };
}
