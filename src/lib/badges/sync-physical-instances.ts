import type { Prisma } from "../../../generated/prisma/client";
import { AdventureBadgeInstanceStatus } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Aligne les lignes `AdventureBadgeInstance` sur un nombre cible d’exemplaires.
 * Ne supprime que des exemplaires encore `AVAILABLE` (les plus grands numéros en premier).
 */
export async function syncPhysicalBadgeInstances(
  tx: Tx,
  adventureId: string,
  targetCount: number
): Promise<void> {
  const n = Math.max(0, Math.floor(targetCount));

  const existing = await tx.adventureBadgeInstance.findMany({
    where: { adventureId },
    select: { id: true, giftNumber: true, status: true },
  });

  const currentCount = existing.length;

  if (n > currentCount) {
    const maxGift = existing.reduce((m, r) => Math.max(m, r.giftNumber), 0);
    let next = maxGift + 1;
    const batch: { adventureId: string; giftNumber: number; status: AdventureBadgeInstanceStatus }[] =
      [];
    for (let i = 0; i < n - currentCount; i++) {
      batch.push({
        adventureId,
        giftNumber: next,
        status: AdventureBadgeInstanceStatus.AVAILABLE,
      });
      next += 1;
    }
    await tx.adventureBadgeInstance.createMany({ data: batch });
    return;
  }

  if (n < currentCount) {
    const toRemove = currentCount - n;
    const removable = await tx.adventureBadgeInstance.findMany({
      where: {
        adventureId,
        status: AdventureBadgeInstanceStatus.AVAILABLE,
      },
      orderBy: { giftNumber: "desc" },
      take: toRemove,
    });
    if (removable.length < toRemove) {
      throw new Error(
        "Impossible de réduire le stock : trop d’exemplaires sont déjà attribués ou marqués indisponibles."
      );
    }
    await tx.adventureBadgeInstance.deleteMany({
      where: { id: { in: removable.map((r) => r.id) } },
    });
  }
}
