import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";

export type PublicAdventureReviewItem = {
  id: string;
  adventureId: string;
  adventureName: string;
  rating: number | null;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
  authorDisplayName: string | null;
};

function publicAuthorName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  return first ?? null;
}

/** Derniers avis publics approuvés (accueil), tri `createdAt` DESC. */
export async function listRecentPublicAdventureReviews(
  limit: number
): Promise<PublicAdventureReviewItem[]> {
  const reviewWhere: Prisma.AdventureReviewWhereInput = {
    moderationStatus: "APPROVED",
  };

  const rows = await prisma.adventureReview.findMany({
    where: reviewWhere,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      adventureId: true,
      rating: true,
      content: true,
      image: true,
      createdAt: true,
      reportsMissingBadge: true,
      reportsStolenTreasure: true,
      adventure: { select: { name: true } },
      user: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    adventureId: r.adventureId,
    adventureName: r.adventure.name,
    rating: r.rating,
    content: r.content,
    imageUrl: r.image,
    createdAt: r.createdAt.toISOString(),
    reportsMissingBadge: r.reportsMissingBadge,
    reportsStolenTreasure: r.reportsStolenTreasure,
    authorDisplayName: publicAuthorName(r.user.name),
  }));
}
