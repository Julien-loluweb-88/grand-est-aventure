import "server-only";

import { prisma } from "@/lib/prisma";

export type AdventureReviewAggregate = {
  /** Moyenne 1–5 ; `null` si aucun avis avec note. */
  averageRating: number | null;
  /** Nombre d’avis `APPROVED` avec `rating` non null (base de la moyenne). */
  reviewCount: number;
};

const EMPTY_AGGREGATE: AdventureReviewAggregate = {
  averageRating: null,
  reviewCount: 0,
};

/**
 * Moyennes par aventure : uniquement avis publics (`moderationStatus: APPROVED`) avec note.
 * Signalements sans étoiles (`rating: null`) exclus du calcul.
 */
export async function loadApprovedReviewAggregatesByAdventureIds(
  adventureIds: string[]
): Promise<Map<string, AdventureReviewAggregate>> {
  const map = new Map<string, AdventureReviewAggregate>();
  if (adventureIds.length === 0) {
    return map;
  }

  const grouped = await prisma.adventureReview.groupBy({
    by: ["adventureId"],
    where: {
      adventureId: { in: adventureIds },
      moderationStatus: "APPROVED",
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  for (const row of grouped) {
    const reviewCount = row._count.rating;
    const avg = row._avg.rating;
    map.set(row.adventureId, {
      reviewCount,
      averageRating:
        reviewCount > 0 && avg != null && Number.isFinite(avg)
          ? Math.round(avg * 10) / 10
          : null,
    });
  }

  return map;
}

export function reviewAggregateForAdventure(
  map: Map<string, AdventureReviewAggregate>,
  adventureId: string
): AdventureReviewAggregate {
  return map.get(adventureId) ?? EMPTY_AGGREGATE;
}
