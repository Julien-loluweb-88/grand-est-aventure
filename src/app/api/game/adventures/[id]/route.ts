import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserRoleForAccess,
  userCanAccessAdventureForPlay,
} from "@/lib/adventure-public-access";
import { listDiscoveryPointsPublicByCityId } from "@/lib/game/discovery-points-public-query";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Détail "safe" d'une aventure pour app mobile.
 * Expose énigmes + trésor sans divulguer les réponses/codes.
 * Inclut les **points de découverte** de la **ville** de l’aventure (même jeu que `GET /api/game/discovery-points?cityId=…`).
 */
export async function GET(_request: NextRequest, context: Ctx) {
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
    },
  });

  if (!adventure) {
    return NextResponse.json({ error: "Aventure introuvable ou inactive." }, { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const viewerUserId = session?.user?.id;
  const viewerRole = viewerUserId
    ? await getUserRoleForAccess(viewerUserId)
    : null;

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
    enigmas: adventure.enigmas,
    treasure: adventure.treasure,
    discoveryPoints,
    updatedAt: adventure.updatedAt.toISOString(),
  });
}
