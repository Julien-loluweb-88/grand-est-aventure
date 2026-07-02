import { NextRequest, NextResponse } from "next/server";
import { getUserRoleForAccess, userCanAccessAdventureForPlay } from "@/lib/adventure-public-access";
import { getOptionalUserIdFromApiRequest } from "@/lib/auth/get-optional-api-session-user-id";
import { loadAdventurePlayerStateForUser } from "@/lib/game/adventure-player-state";
import {
  batchBuildPlayAvailabilityByAdventureIds,
  batchLoadMyReviewByUserAndAdventureIds,
  playAvailabilitySourceFromCatalogRow,
} from "@/lib/game/adventure-play-availability";
import {
  loadPlayerCompletionBadgeForAdventure,
  serializeAdventureCompletionBadge,
} from "@/lib/badges/adventure-completion-badge-public";
import { listDiscoveryPointsPublicByCityId } from "@/lib/game/discovery-points-public-query";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Détail "safe" d'une aventure pour app mobile.
 * Expose énigmes + trésor sans divulguer les réponses/codes.
 * Inclut les **points de découverte** de la **ville** de l’aventure (même jeu que `GET /api/game/discovery-points?cityId=…`).
 */
export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const adventureId = id.trim();
  if (!adventureId) {
    return NextResponse.json({ error: "id requis." }, { status: 400 });
  }

  const adventure = await prisma.adventure.findFirst({
    where: { id: adventureId, status: true },
    select: {
      id: true,
      name: true,
      audience: true,
      description: true,
      latitude: true,
      longitude: true,
      distance: true,
      estimatedPlayDurationSeconds: true,
      averagePlayDurationSeconds: true,
      playDurationSampleCount: true,
      coverImageUrl: true,
      physicalBadgeStockCount: true,
      treasureUnavailable: true,
      treasureUnavailableMessage: true,
      treasureUnavailableUpdatedAt: true,
      physicalBadgesUnavailable: true,
      physicalBadgesUnavailableMessage: true,
      physicalBadgesUnavailableUpdatedAt: true,
      updatedAt: true,
      city: {
        select: {
          id: true,
          name: true,
          postalCodes: true,
          latitude: true,
          longitude: true,
        },
      },
      enigmas: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          name: true,
          question: true,
          description: true,
          answerMessage: true,
          latitude: true,
          longitude: true,
          imageUrl: true,
          uniqueResponse: true,
          multiSelect: true,
          choice: true,
        },
      },
      treasure: {
        select: {
          id: true,
          name: true,
          description: true,
          latitude: true,
          longitude: true,
          imageUrl: true,
        },
      },
      virtualBadge: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const viewerUserId = await getOptionalUserIdFromApiRequest(request);
  const viewerRole = viewerUserId ? await getUserRoleForAccess(viewerUserId) : null;

  const canPlay = await userCanAccessAdventureForPlay(prisma, {
    userId: viewerUserId ?? "__no_session__",
    role: viewerRole,
    adventure: {
      id: adventure.id,
      status: true,
      audience: adventure.audience,
    },
  });
  if (!canPlay) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const discoveryPoints = await listDiscoveryPointsPublicByCityId(
    adventure.city.id,
    viewerUserId ? { userId: viewerUserId, role: viewerRole } : null
  );

  const playerState = viewerUserId
    ? await loadAdventurePlayerStateForUser(viewerUserId, {
        adventureId: adventure.id,
        requiredEnigmaNumbers: adventure.enigmas.map((e) => e.number),
        hasTreasure: adventure.treasure != null,
      })
    : undefined;

  const userAdventureRow = viewerUserId
    ? await prisma.userAdventures.findFirst({
        where: { userId: viewerUserId, adventureId: adventure.id },
        select: { success: true, giftNumber: true, updatedAt: true },
      })
    : null;

  const playAvailabilityMap = await batchBuildPlayAvailabilityByAdventureIds([
    {
      adventureId: adventure.id,
      source: playAvailabilitySourceFromCatalogRow({
        treasure: adventure.treasure,
        physicalBadgeStockCount: adventure.physicalBadgeStockCount,
        treasureUnavailable: adventure.treasureUnavailable,
        treasureUnavailableMessage: adventure.treasureUnavailableMessage,
        treasureUnavailableUpdatedAt: adventure.treasureUnavailableUpdatedAt,
        physicalBadgesUnavailable: adventure.physicalBadgesUnavailable,
        physicalBadgesUnavailableMessage: adventure.physicalBadgesUnavailableMessage,
        physicalBadgesUnavailableUpdatedAt: adventure.physicalBadgesUnavailableUpdatedAt,
      }),
    },
  ]);
  const playAvailability = playAvailabilityMap.get(adventure.id)!;

  const myReviewMap = viewerUserId
    ? await batchLoadMyReviewByUserAndAdventureIds(viewerUserId, [adventure.id])
    : new Map();
  const myReview = viewerUserId ? myReviewMap.get(adventure.id) : undefined;

  const completionBadge = serializeAdventureCompletionBadge(adventure.virtualBadge);
  const playerCompletionBadge = viewerUserId
    ? await loadPlayerCompletionBadgeForAdventure(
        viewerUserId,
        adventure.virtualBadge?.id
      )
    : null;

  return NextResponse.json({
    id: adventure.id,
    name: adventure.name,
    description: adventure.description,
    city: adventure.city,
    coverImageUrl: adventure.coverImageUrl,
    latitude: adventure.latitude,
    longitude: adventure.longitude,
    distanceKm: adventure.distance,
    estimatedDurationSeconds: adventure.estimatedPlayDurationSeconds,
    averagePlayDurationSeconds: adventure.averagePlayDurationSeconds,
    playDurationSampleCount: adventure.playDurationSampleCount,
    physicalBadgeStockCount: adventure.physicalBadgeStockCount,
    playAvailability,
    completionBadge,
    ...(playerCompletionBadge ? { playerCompletionBadge } : {}),
    enigmas: adventure.enigmas,
    treasure: adventure.treasure,
    discoveryPoints,
    updatedAt: adventure.updatedAt.toISOString(),
    ...(playerState ? { playerState } : {}),
    ...(viewerUserId
      ? {
          userAdventure: userAdventureRow
            ? {
                success: userAdventureRow.success,
                giftNumber: userAdventureRow.giftNumber,
                updatedAt: userAdventureRow.updatedAt.toISOString(),
              }
            : null,
        }
      : {}),
    ...(myReview ? { myReview } : {}),
  });
}
