import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

export type DiscoveryPointAdminRow = {
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
};

export async function listDiscoveryPointsAdmin(opts: {
  cityId: string;
  scope: { type: "city" } | { type: "adventure"; adventureId: string };
}): Promise<DiscoveryPointAdminRow[] | null> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }

  const where =
    opts.scope.type === "city"
      ? { cityId: opts.cityId, adventureId: null as null }
      : { cityId: opts.cityId, adventureId: opts.scope.adventureId };

  const rows = await prisma.discoveryPoint.findMany({
    where,
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
  return rows;
}
