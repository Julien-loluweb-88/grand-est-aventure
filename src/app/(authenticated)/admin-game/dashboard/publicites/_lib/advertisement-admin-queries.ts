import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminActorForAuthorization } from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";
import type { Prisma } from "../../../../../../../generated/prisma/client";

export type AdvertisementListRow = {
  id: string;
  name: string;
  advertiserName: string;
  placement: string;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  impressionCount: number;
  clickCount: number;
};

export async function listAdvertisementsForAdminTable(): Promise<
  AdvertisementListRow[] | null
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }

  const [ads, stats] = await Promise.all([
    prisma.advertisement.findMany({
      select: {
        id: true,
        name: true,
        advertiserName: true,
        placement: true,
        active: true,
        startsAt: true,
        endsAt: true,
      },
      orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.advertisementEvent.groupBy({
      by: ["advertisementId", "type"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<string, { impression: number; click: number }>();
  for (const row of stats) {
    const cur = countMap.get(row.advertisementId) ?? { impression: 0, click: 0 };
    if (row.type === "IMPRESSION") cur.impression = row._count._all;
    if (row.type === "CLICK") cur.click = row._count._all;
    countMap.set(row.advertisementId, cur);
  }

  return ads.map((a) => ({
    ...a,
    impressionCount: countMap.get(a.id)?.impression ?? 0,
    clickCount: countMap.get(a.id)?.click ?? 0,
  }));
}

export type AdvertisementEditRow = Prisma.AdvertisementGetPayload<{
  include: {
    targetCities: { select: { id: true } };
    partnerBadgeDefinition: { select: { id: true; title: true; imageUrl: true } };
    merchantAssignments: { select: { userId: true } };
  };
}>;

export type MerchantUserOption = {
  id: string;
  email: string;
  name: string | null;
};

export async function listMerchantUsersForAdvertisementForm(): Promise<
  MerchantUserOption[] | null
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) return null;
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return null;
  }
  return prisma.user.findMany({
    where: { role: "merchant" },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });
}

export async function getAdvertisementForAdminEdit(
  id: string
): Promise<
  | { ok: true; data: AdvertisementEditRow }
  | { ok: false; reason: "auth" | "missing" }
> {
  const actor = await getAdminActorForAuthorization();
  if (!actor) {
    return { ok: false, reason: "auth" };
  }
  if (!(await userHasPermissionServer({ permissions: { adventure: ["read"] } }))) {
    return { ok: false, reason: "auth" };
  }

  const row = await prisma.advertisement.findUnique({
    where: { id },
    include: {
      targetCities: { select: { id: true } },
      partnerBadgeDefinition: { select: { id: true, title: true, imageUrl: true } },
      merchantAssignments: { select: { userId: true } },
    },
  });
  if (!row) {
    return { ok: false, reason: "missing" };
  }
  return { ok: true, data: row };
}
