import { NextRequest, NextResponse } from "next/server";
import { listEligibleAdvertisements } from "@/lib/advertisements/list-eligible-advertisements";
import { HOME_ADVERTISEMENT_PLACEMENT } from "@/lib/advertisements/advertisement-placements";
import { getOptionalUserIdFromApiRequest } from "@/lib/auth/get-optional-api-session-user-id";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import { batchLoadAdventurePlayerStateByUser } from "@/lib/game/adventure-player-state";
import { getHomeCommunityStats } from "@/lib/game/community-stats";
import { loadApprovedReviewAggregatesByAdventureIds, reviewAggregateForAdventure } from "@/lib/game/adventure-review-aggregates";
import {
  attachDistanceFromUser,
  buildPlayAvailabilityMapForCatalogRows,
  catalogRowToPlayerStateBatchInput,
  fetchPublicCatalogAdventures,
  selectFeaturedAdventures,
  sortCatalogRowsByDistanceFromUser,
  toMobileAdventureListItem,
} from "@/lib/game/mobile-adventure-catalog";
import { batchLoadMyReviewByUserAndAdventureIds } from "@/lib/game/adventure-play-availability";
import { listRecentPublicAdventureReviews } from "@/lib/game/public-adventure-reviews";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const DEFAULT_REVIEWS_LIMIT = 25;
const MAX_REVIEWS_LIMIT = 50;
const DEFAULT_FEATURED_LIMIT = 3;

function parseNumber(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIntParam(value: string | null, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Agrégat accueil app mobile (sans authentification obligatoire).
 *
 * Query :
 * - latitude, longitude — distance utilisateur, sélection `featuredAdventures`, ciblage pub + inférence ville
 * - reviewsLimit (défaut 25, max 50)
 * - featuredLimit (défaut 3)
 *
 * Auth optionnelle : stats perso (`communityStats.scope: user`), exclusion pubs masquées.
 * Pas de 401 — l’accueil reste public.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`game-home:${ip}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  const p = request.nextUrl.searchParams;
  const latitude = parseNumber(p.get("latitude"));
  const longitude = parseNumber(p.get("longitude"));

  if ((latitude == null) !== (longitude == null)) {
    return NextResponse.json(
      { error: "latitude et longitude doivent être fournies ensemble." },
      { status: 400 }
    );
  }

  const reviewsLimit = Math.min(
    MAX_REVIEWS_LIMIT,
    Math.max(1, parseIntParam(p.get("reviewsLimit"), DEFAULT_REVIEWS_LIMIT))
  );
  const featuredLimit = Math.max(
    1,
    parseIntParam(p.get("featuredLimit"), DEFAULT_FEATURED_LIMIT)
  );

  const userId = await getOptionalUserIdFromApiRequest(request);

  const catalogRows = await fetchPublicCatalogAdventures();
  const adventureIds = catalogRows.map((r) => r.id);

  const [communityStats, recentReviews, reviewAggregates, adResult] = await Promise.all([
    getHomeCommunityStats(userId),
    listRecentPublicAdventureReviews(reviewsLimit),
    loadApprovedReviewAggregatesByAdventureIds(adventureIds),
    listEligibleAdvertisements({
      placement: HOME_ADVERTISEMENT_PLACEMENT,
      latitude,
      longitude,
      userId,
      inferCityFromCoordinates: true,
    }),
  ]);

  const withDistance = sortCatalogRowsByDistanceFromUser(
    attachDistanceFromUser(catalogRows, latitude, longitude)
  );

  const playerStateByAdventureId = userId
    ? await batchLoadAdventurePlayerStateByUser(
        userId,
        catalogRows.map((row) => catalogRowToPlayerStateBatchInput(row))
      )
    : new Map();

  const [playAvailabilityById, myReviewById] = await Promise.all([
    buildPlayAvailabilityMapForCatalogRows(catalogRows),
    userId
      ? batchLoadMyReviewByUserAndAdventureIds(userId, adventureIds)
      : Promise.resolve(new Map()),
  ]);

  const adventures = withDistance.map(({ row, distanceFromUserKm }) =>
    toMobileAdventureListItem(
      row,
      distanceFromUserKm,
      reviewAggregateForAdventure(reviewAggregates, row.id),
      playAvailabilityById.get(row.id)!,
      userId ? playerStateByAdventureId.get(row.id) : undefined,
      userId ? myReviewById.get(row.id) : undefined
    )
  );
  const featuredAdventures = selectFeaturedAdventures(adventures, featuredLimit);

  return NextResponse.json({
    communityStats: {
      scope: communityStats.scope,
      totalEnigmasSolved: communityStats.totalEnigmasSolved,
      totalAdventuresCompleted: communityStats.totalAdventuresCompleted,
      totalBadgesEarned: communityStats.totalBadgesEarned,
    },
    advertisements: adResult.advertisements,
    locationContext: adResult.locationContext,
    adventures,
    featuredAdventures,
    recentReviews,
  });
}
