import type { Prisma } from "../../../generated/prisma/client";
import {
  AdventureBadgeInstanceStatus,
  AdventureBadgeStockEventKind,
} from "../../../generated/prisma/client";
import { recomputePhysicalBadgeStockCount } from "@/lib/badges/recompute-physical-badge-stock-count";

type Tx = Prisma.TransactionClient;

/** Marque les exemplaires AVAILABLE comme STOLEN ; no-op si aucun dispo. */
export async function applyPhysicalBadgeLossAllInTx(
  tx: Tx,
  input: {
    adventureId: string;
    note: string;
    createdByUserId?: string | null;
  }
): Promise<{ markedCount: number }> {
  const available = await tx.adventureBadgeInstance.findMany({
    where: { adventureId: input.adventureId, status: AdventureBadgeInstanceStatus.AVAILABLE },
    select: { id: true },
  });
  if (available.length === 0) {
    return { markedCount: 0 };
  }

  await tx.adventureBadgeInstance.updateMany({
    where: { id: { in: available.map((r) => r.id) } },
    data: { status: AdventureBadgeInstanceStatus.STOLEN },
  });

  const availableAfter = await tx.adventureBadgeInstance.count({
    where: {
      adventureId: input.adventureId,
      status: AdventureBadgeInstanceStatus.AVAILABLE,
    },
  });

  await tx.adventureBadgeStockEvent.create({
    data: {
      adventureId: input.adventureId,
      kind: AdventureBadgeStockEventKind.LOSS_INCIDENT,
      availableDelta: -available.length,
      availableAfter,
      note: input.note.trim(),
      createdByUserId: input.createdByUserId ?? null,
    },
  });

  await recomputePhysicalBadgeStockCount(tx, input.adventureId);
  return { markedCount: available.length };
}
