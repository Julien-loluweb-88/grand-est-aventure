import type { Prisma } from "../../../generated/prisma/client";
import { userCanAccessAdventureForPlay } from "@/lib/adventure-public-access";

type Tx = Prisma.TransactionClient;

const MAX_REVIEW_CONTENT = 10_000;

export class ReviewValidationError extends Error {
  constructor(
    public readonly code:
      | "INVALID_RATING"
      | "CONTENT_TOO_LONG"
      | "ADVENTURE_NOT_FOUND"
      | "EMPTY_REVIEW"
  ) {
    super(code);
    this.name = "ReviewValidationError";
  }
}

export type ProcessAdventureReviewInput = {
  adventureId: string;
  userId: string;
  /** Rôle Better Auth (accès aventures démo). */
  userRole: string | null | undefined;
  /** Nombre 1–5, chaîne numérique, ou omis / null pour « pas de note ». */
  rating?: unknown;
  content: string;
  image?: string | null;
  consentCommunicationNetworks: boolean;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
};

function normalizeRating(rating: unknown): number | null {
  if (rating == null || rating === "") return null;
  if (typeof rating === "string") {
    const n = parseInt(rating, 10);
    if (!Number.isFinite(n)) return null;
    return n >= 1 && n <= 5 ? n : null;
  }
  if (typeof rating !== "number" || !Number.isInteger(rating)) return null;
  return rating >= 1 && rating <= 5 ? rating : null;
}

function normalizeContent(raw: string): string | null {
  const withoutNull = raw.replace(/\0/g, "");
  if (withoutNull.length > MAX_REVIEW_CONTENT) {
    throw new ReviewValidationError("CONTENT_TOO_LONG");
  }
  const t = withoutNull.trim();
  return t.length === 0 ? null : t;
}

/**
 * Crée ou met à jour l’avis (une ligne par couple user + aventure, cf. @@unique).
 */
export async function processAdventureReview(
  tx: Tx,
  input: ProcessAdventureReviewInput
): Promise<{ id: string }> {
  const adventure = await tx.adventure.findUnique({
    where: { id: input.adventureId },
    select: { id: true, status: true, audience: true },
  });
  if (!adventure) {
    throw new ReviewValidationError("ADVENTURE_NOT_FOUND");
  }

  const canAccess = await userCanAccessAdventureForPlay(tx, {
    userId: input.userId,
    role: input.userRole,
    adventure,
  });
  if (!canAccess) {
    throw new ReviewValidationError("ADVENTURE_NOT_FOUND");
  }

  const ratingProvided =
    input.rating !== undefined &&
    input.rating !== null &&
    input.rating !== "";
  const normalizedRating = normalizeRating(input.rating);
  if (ratingProvided && normalizedRating === null) {
    throw new ReviewValidationError("INVALID_RATING");
  }

  const contentNorm = normalizeContent(input.content);

  const consent = input.consentCommunicationNetworks;
  const reportsMissingBadge = input.reportsMissingBadge;
  const reportsStolenTreasure = input.reportsStolenTreasure;

  const imageTrimmed =
    input.image != null && typeof input.image === "string" ? input.image.trim() : "";
  const hasImage = imageTrimmed.length > 0;

  const hasPayload =
    normalizedRating != null ||
    (contentNorm != null && contentNorm.length > 0) ||
    reportsMissingBadge ||
    reportsStolenTreasure ||
    consent ||
    hasImage;

  if (!hasPayload) {
    throw new ReviewValidationError("EMPTY_REVIEW");
  }

  const userAdventure = await tx.userAdventures.findFirst({
    where: { userId: input.userId, adventureId: input.adventureId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  const row = await tx.adventureReview.upsert({
    where: {
      userId_adventureId: {
        userId: input.userId,
        adventureId: input.adventureId,
      },
    },
    create: {
      userId: input.userId,
      adventureId: input.adventureId,
      rating: normalizedRating,
      content: contentNorm,
      consentCommunicationNetworks: consent,
      reportsMissingBadge,
      reportsStolenTreasure,
      userAdventureId: userAdventure?.id,
      image: imageTrimmed.length > 0 ? imageTrimmed : null,
    },
    update: {
      rating: normalizedRating,
      content: contentNorm,
      consentCommunicationNetworks: consent,
      reportsMissingBadge,
      reportsStolenTreasure,
      ...(userAdventure?.id ? { userAdventureId: userAdventure.id } : {}),
      ...(input.image !== undefined
        ? { image: imageTrimmed.length > 0 ? imageTrimmed : null }
        : {}),
    },
    select: { id: true },
  });

  return { id: row.id };
}
