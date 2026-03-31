import type { Prisma } from "../../../generated/prisma/client";
import {
  AdventureBadgeInstanceStatus,
  BadgeDefinitionKind,
} from "../../../generated/prisma/client";
import { assertCanFinishWithSuccess } from "@/lib/game/server-adventure-progress";

type Tx = Prisma.TransactionClient;

type Criteria = {
  minCompletedAdventures?: number;
  minKmTotal?: number;
};

function parseCriteria(raw: Prisma.JsonValue | null | undefined): Criteria {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Criteria;
}

/** Compte d’aventures distinctes réussies pour l’utilisateur. */
async function countDistinctCompletedAdventures(
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

/** Somme des distances (km) des aventures distinctes réussies (une fois par aventure). */
async function sumKmCompletedAdventures(
  tx: Tx,
  userId: string
): Promise<number> {
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

  const awardedUserBadgeIds: string[] = [];

  if (!success) {
    return { awardedUserBadgeIds };
  }

  const adventureDef = await tx.badgeDefinition.findUnique({
    where: { adventureId },
  });
  if (adventureDef) {
    const row = await tx.userBadge.upsert({
      where: {
        userId_badgeDefinitionId: {
          userId,
          badgeDefinitionId: adventureDef.id,
        },
      },
      create: { userId, badgeDefinitionId: adventureDef.id },
      update: {},
    });
    awardedUserBadgeIds.push(row.id);
  }

  const milestones = await tx.badgeDefinition.findMany({
    where: {
      kind: {
        in: [
          BadgeDefinitionKind.MILESTONE_ADVENTURES,
          BadgeDefinitionKind.MILESTONE_KM,
        ],
      },
    },
  });

  const completedAdventures = await countDistinctCompletedAdventures(
    tx,
    userId
  );
  const totalKm = await sumKmCompletedAdventures(tx, userId);

  for (const def of milestones) {
    const c = parseCriteria(def.criteria);
    let ok = false;
    if (def.kind === BadgeDefinitionKind.MILESTONE_ADVENTURES) {
      const min = c.minCompletedAdventures;
      if (typeof min === "number" && completedAdventures >= min) {
        ok = true;
      }
    } else if (def.kind === BadgeDefinitionKind.MILESTONE_KM) {
      const min = c.minKmTotal;
      if (typeof min === "number" && totalKm >= min) {
        ok = true;
      }
    }
    if (!ok) {
      continue;
    }
    const row = await tx.userBadge.upsert({
      where: {
        userId_badgeDefinitionId: {
          userId,
          badgeDefinitionId: def.id,
        },
      },
      create: { userId, badgeDefinitionId: def.id },
      update: {},
    });
    awardedUserBadgeIds.push(row.id);
  }

  return { awardedUserBadgeIds };
}
