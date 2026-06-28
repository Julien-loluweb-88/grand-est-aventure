import "server-only";

import {
  buildAdventureReviewVisibilityWhere,
} from "@/lib/adventure-public-access";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";

export type PublicAdventureReviewItem = {
  id: string;
  adventureId: string | null;
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

function isDisplayablePublicReview(row: {
  rating: number | null;
  content: string | null;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
}): boolean {
  const hasRating = row.rating != null;
  const hasContent = Boolean(row.content?.trim());
  const reportOnly =
    !hasRating &&
    !hasContent &&
    (row.reportsMissingBadge || row.reportsStolenTreasure);
  return !reportOnly;
}

function mapReviewRows(
  rows: {
    id: string;
    adventureId: string | null;
    archivedAdventureName: string | null;
    rating: number | null;
    content: string | null;
    image: string | null;
    createdAt: Date;
    reportsMissingBadge: boolean;
    reportsStolenTreasure: boolean;
    adventure: { name: string } | null;
    user: { name: string | null };
  }[]
): PublicAdventureReviewItem[] {
  return rows.filter(isDisplayablePublicReview).map((r) => ({
    id: r.id,
    adventureId: r.adventureId,
    adventureName:
      r.adventure?.name ??
      r.archivedAdventureName?.trim() ??
      "Aventure supprimée",
    rating: r.rating,
    content: r.content,
    imageUrl: r.image,
    createdAt: r.createdAt.toISOString(),
    reportsMissingBadge: r.reportsMissingBadge,
    reportsStolenTreasure: r.reportsStolenTreasure,
    authorDisplayName: publicAuthorName(r.user.name),
  }));
}

const reviewListSelect = {
  id: true,
  adventureId: true,
  archivedAdventureName: true,
  rating: true,
  content: true,
  image: true,
  createdAt: true,
  reportsMissingBadge: true,
  reportsStolenTreasure: true,
  adventure: { select: { name: true } },
  user: { select: { name: true } },
} as const;

/**
 * Derniers avis approuvés catalogue uniquement (site vitrine web).
 * Pour l’app : préférer `listApprovedAdventureReviewsForViewer`.
 */
export async function listRecentPublicAdventureReviews(
  limit: number
): Promise<PublicAdventureReviewItem[]> {
  const { reviews } = await listApprovedAdventureReviewsForViewer({
    viewerId: null,
    viewerRole: null,
    limit,
    offset: 0,
    reportsOnly: false,
  });
  return reviews;
}

/**
 * Liste globale d’avis approuvés, filtrée selon session (catalogue ± droits démo/dev).
 */
export async function listApprovedAdventureReviewsForViewer(params: {
  viewerId: string | null;
  viewerRole: string | null | undefined;
  limit: number;
  offset: number;
  reportsOnly: boolean;
}): Promise<{ total: number; reviews: PublicAdventureReviewItem[] }> {
  const visibility = await buildAdventureReviewVisibilityWhere({
    viewerId: params.viewerId,
    viewerRole: params.viewerRole,
  });

  const reviewWhere: Prisma.AdventureReviewWhereInput = {
    ...visibility,
    moderationStatus: "APPROVED",
    ...(params.reportsOnly
      ? { OR: [{ reportsMissingBadge: true }, { reportsStolenTreasure: true }] }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.adventureReview.count({ where: reviewWhere }),
    prisma.adventureReview.findMany({
      where: reviewWhere,
      orderBy: { createdAt: "desc" },
      skip: params.offset,
      take: params.limit,
      select: reviewListSelect,
    }),
  ]);

  return { total, reviews: mapReviewRows(rows) };
}
