import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserIdFromApiRequest } from "@/lib/auth/get-optional-api-session-user-id";
import { batchLoadAdventurePlayerStateByUser } from "@/lib/game/adventure-player-state";
import {
  loadApprovedReviewAggregatesByAdventureIds,
  reviewAggregateForAdventure,
} from "@/lib/game/adventure-review-aggregates";
import { parseCatalogListQuery } from "@/lib/game/catalog-list-query";
import {
  buildPlayAvailabilityMapForCatalogRows,
  catalogRowToPlayerStateBatchInput,
  queryPublicCatalogAdventureList,
  toMobileAdventureListItem,
} from "@/lib/game/mobile-adventure-catalog";
import { batchLoadMyReviewByUserAndAdventureIds } from "@/lib/game/adventure-play-availability";

/**
 * Liste catalogue mobile (`PUBLIC` actives uniquement).
 *
 * Query : `cityId`, `q`, `latitude`+`longitude`, `radiusKm`, `hasTreasure`,
 * `sort` (`distance`|`updated`|`popular`|`rating`|`name`), `limit`, `offset`.
 */
export async function GET(request: NextRequest) {
  const parsed = parseCatalogListQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { query, applied } = parsed;
  const { total, rows } = await queryPublicCatalogAdventureList(query);
  const paginated = rows.slice(query.offset, query.offset + query.limit);
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
    total,
    limit: query.limit,
    offset: query.offset,
    filters: applied,
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
