import type { Prisma } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Met `Adventure.physicalBadgeStockCount` au nombre total d’exemplaires (tous statuts). */
export async function recomputePhysicalBadgeStockCount(
  tx: Tx,
  adventureId: string
): Promise<void> {
  const total = await tx.adventureBadgeInstance.count({ where: { adventureId } });
  await tx.adventure.update({
    where: { id: adventureId },
    data: { physicalBadgeStockCount: total },
  });
}
