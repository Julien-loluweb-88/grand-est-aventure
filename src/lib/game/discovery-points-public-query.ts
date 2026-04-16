import "server-only";

import { AdventureAudience } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { userCanAccessAdventureForPlay } from "@/lib/adventure-public-access";

/** Données publiques POI « découverte » (même forme que `GET /api/game/discovery-points`). */
export async function listDiscoveryPointsPublicByCityId(
  cityId: string,
  viewer?: { userId: string; role: string | null | undefined } | null
) {
  const rows = await prisma.discoveryPoint.findMany({
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
      adventure: {
        select: { id: true, audience: true, status: true },
      },
    },
  });

  const out: {
    id: string;
    cityId: string;
    adventureId: string | null;
    title: string;
    teaser: string | null;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    imageUrl: string | null;
    sortOrder: number;
  }[] = [];

  for (const r of rows) {
    if (!r.adventureId) {
      out.push({
        id: r.id,
        cityId: r.cityId,
        adventureId: null,
        title: r.title,
        teaser: r.teaser,
        latitude: r.latitude,
        longitude: r.longitude,
        radiusMeters: r.radiusMeters,
        imageUrl: r.imageUrl,
        sortOrder: r.sortOrder,
      });
      continue;
    }

    const adv = r.adventure;
    if (!adv || adv.status === false) {
      continue;
    }

    if (adv.audience === AdventureAudience.PUBLIC) {
      out.push({
        id: r.id,
        cityId: r.cityId,
        adventureId: r.adventureId,
        title: r.title,
        teaser: r.teaser,
        latitude: r.latitude,
        longitude: r.longitude,
        radiusMeters: r.radiusMeters,
        imageUrl: r.imageUrl,
        sortOrder: r.sortOrder,
      });
      continue;
    }

    if (!viewer) {
      continue;
    }

    const ok = await userCanAccessAdventureForPlay(prisma, {
      userId: viewer.userId,
      role: viewer.role,
      adventure: {
        id: adv.id,
        status: adv.status,
        audience: adv.audience,
      },
    });
    if (ok) {
      out.push({
        id: r.id,
        cityId: r.cityId,
        adventureId: r.adventureId,
        title: r.title,
        teaser: r.teaser,
        latitude: r.latitude,
        longitude: r.longitude,
        radiusMeters: r.radiusMeters,
        imageUrl: r.imageUrl,
        sortOrder: r.sortOrder,
      });
    }
  }

  return out;
}
