import "server-only";

import { prisma } from "@/lib/prisma";

/** Données publiques POI « découverte » (même forme que `GET /api/game/discovery-points`). */
export async function listDiscoveryPointsPublicByCityId(cityId: string) {
  return prisma.discoveryPoint.findMany({
    where: { cityId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      cityId: true,
      adventureId: true,
      title: true,
      teaser: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      imageUrl: true,
      sortOrder: true,
    },
  });
}
