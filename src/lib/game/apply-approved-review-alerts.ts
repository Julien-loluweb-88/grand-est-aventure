import type { Prisma } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

const ALERT_MESSAGE_MAX = 500;

function alertMessageFromReview(content: string | null | undefined): string | null {
  const trimmed = content?.trim() ?? "";
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.length > ALERT_MESSAGE_MAX
    ? trimmed.slice(0, ALERT_MESSAGE_MAX)
    : trimmed;
}

/**
 * Active les alertes joueur (`playAvailability`) lorsqu’un avis/signalement est **validé** (APPROVED).
 */
export async function applyApprovedReviewAlerts(
  tx: Tx,
  input: {
    adventureId: string;
    reportsStolenTreasure: boolean;
    reportsMissingBadge: boolean;
    reviewContent: string | null;
    actorUserId?: string | null;
  }
): Promise<void> {
  if (!input.reportsStolenTreasure && !input.reportsMissingBadge) {
    return;
  }

  const adventure = await tx.adventure.findUnique({
    where: { id: input.adventureId },
    select: {
      id: true,
      treasure: { select: { id: true } },
      physicalBadgeStockCount: true,
    },
  });
  if (!adventure) {
    return;
  }

  const now = new Date();
  const adventureUpdate: Prisma.AdventureUpdateInput = {};

  if (input.reportsStolenTreasure && adventure.treasure != null) {
    adventureUpdate.treasureUnavailable = true;
    adventureUpdate.treasureUnavailableMessage = alertMessageFromReview(input.reviewContent);
    adventureUpdate.treasureUnavailableUpdatedAt = now;
  }

  if (input.reportsMissingBadge) {
    adventureUpdate.physicalBadgesUnavailable = true;
    adventureUpdate.physicalBadgesUnavailableMessage = alertMessageFromReview(
      input.reviewContent
    );
    adventureUpdate.physicalBadgesUnavailableUpdatedAt = now;

    if (adventure.physicalBadgeStockCount > 0) {
      const { applyPhysicalBadgeLossAllInTx } = await import(
        "@/lib/badges/apply-physical-badge-loss-all"
      );
      await applyPhysicalBadgeLossAllInTx(tx, {
        adventureId: input.adventureId,
        note: `Signalement joueur validé — badges indisponibles.${input.reviewContent?.trim() ? ` ${input.reviewContent.trim().slice(0, 200)}` : ""}`,
        createdByUserId: input.actorUserId ?? null,
      });
    }
  }

  if (Object.keys(adventureUpdate).length > 0) {
    await tx.adventure.update({
      where: { id: input.adventureId },
      data: adventureUpdate,
    });
  }
}
