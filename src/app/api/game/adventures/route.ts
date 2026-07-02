import { NextRequest, NextResponse } from "next/server";
import { publicCatalogAdventureWhere } from "@/lib/adventure-public-access";
import { getOptionalUserIdFromApiRequest } from "@/lib/auth/get-optional-api-session-user-id";
import { batchLoadAdventurePlayerStateByUser } from "@/lib/game/adventure-player-state";
import {
  loadApprovedReviewAggregatesByAdventureIds,
  reviewAggregateForAdventure,
} from "@/lib/game/adventure-review-aggregates";
import {
  attachDistanceFromUser,
  buildPlayAvailabilityMapForCatalogRows,
  catalogRowToPlayerStateBatchInput,
  sortCatalogRowsByDistanceFromUser,
  toMobileAdventureListItem,
} from "@/lib/game/mobile-adventure-catalog";
import { batchLoadMyReviewByUserAndAdventureIds } from "@/lib/game/adventure-play-availability";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseNumber(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Liste "safe" des aventures pour app mobile.
 * Query params:
 * - cityId?: string
 * - q?: string (recherche sur nom)
 * - latitude?: number
 * - longitude?: number
 * - radiusKm?: number (nécessite latitude+longitude)
 * - limit?: number (default 20, max 100)
 * - offset?: number (default 0)
 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  const cityId = (p.get("cityId") ?? "").trim() || undefined;
  const q = (p.get("q") ?? "").trim();
  const latitude = parseNumber(p.get("latitude"));
  const longitude = parseNumber(p.get("longitude"));
  const radiusKm = parseNumber(p.get("radiusKm"));

  const limitRaw = parseNumber(p.get("limit"));
  const offsetRaw = parseNumber(p.get("offset"));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isInteger(limitRaw) ? (limitRaw as number) : DEFAULT_LIMIT)
  );
  const offset = Math.max(0, Number.isInteger(offsetRaw) ? (offsetRaw as number) : 0);

  if ((latitude == null) !== (longitude == null)) {
    return NextResponse.json(
      { error: "latitude et longitude doivent être fournies ensemble." },
      { status: 400 }
    );
  }
  if (radiusKm != null && (latitude == null || longitude == null)) {
    return NextResponse.json(
      { error: "radiusKm nécessite latitude et longitude." },
      { status: 400 }
    );
  }
  if (radiusKm != null && radiusKm <= 0) {
    return NextResponse.json({ error: "radiusKm doit être > 0." }, { status: 400 });
  }

  const adventures = await prisma.adventure.findMany({
    where: {
      ...publicCatalogAdventureWhere,
      ...(cityId ? { cityId } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      cityId: true,
      latitude: true,
      longitude: true,
      distance: true,
      estimatedPlayDurationSeconds: true,
      averagePlayDurationSeconds: true,
      playDurationSampleCount: true,
      coverImageUrl: true,
      updatedAt: true,
      physicalBadgeStockCount: true,
      treasureUnavailable: true,
      treasureUnavailableMessage: true,
      treasureUnavailableUpdatedAt: true,
      physicalBadgesUnavailable: true,
      physicalBadgesUnavailableMessage: true,
      physicalBadgesUnavailableUpdatedAt: true,
      city: {
        select: {
          id: true,
          name: true,
          postalCodes: true,
        },
      },
      enigmas: { select: { id: true, number: true } },
      treasure: { select: { id: true } },
    },
  });

  const withDistance = sortCatalogRowsByDistanceFromUser(
    attachDistanceFromUser(adventures, latitude, longitude)
  );
  const filtered = withDistance.filter(
    ({ distanceFromUserKm }) =>
      radiusKm == null ? true : (distanceFromUserKm ?? Infinity) <= radiusKm
  );

  const paginated = filtered.slice(offset, offset + limit);
  const paginatedIds = paginated.map(({ row }) => row.id);

  const userId = await getOptionalUserIdFromApiRequest(request);

  const [reviewAggregates, playerStateByAdventureId, playAvailabilityById, myReviewById] =
    await Promise.all([
    loadApprovedReviewAggregatesByAdventureIds(paginatedIds),
    userId
      ? batchLoadAdventurePlayerStateByUser(
          userId,
          paginated.map(({ row }) => catalogRowToPlayerStateBatchInput(row))
        )
      : Promise.resolve(new Map()),
    buildPlayAvailabilityMapForCatalogRows(paginated.map(({ row }) => row)),
    userId
      ? batchLoadMyReviewByUserAndAdventureIds(userId, paginatedIds)
      : Promise.resolve(new Map()),
  ]);

  return NextResponse.json({
    total: filtered.length,
    limit,
    offset,
    adventures: paginated.map(({ row, distanceFromUserKm }) =>
      toMobileAdventureListItem(
        row,
        distanceFromUserKm,
        reviewAggregateForAdventure(reviewAggregates, row.id),
        playAvailabilityById.get(row.id)!,
        userId ? playerStateByAdventureId.get(row.id) : undefined,
        userId ? myReviewById.get(row.id) : undefined
      )
    ),
  });
}
