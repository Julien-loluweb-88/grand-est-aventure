import "server-only";

import { prisma } from "@/lib/prisma";
import { assertSuperadminForAdvertisements } from "@/lib/advertisements/merchant-advertisement-authorization";
import type { Prisma } from "../../../../../../../generated/prisma/client";
import { AdvertisementMerchantContentStatus } from "@/lib/badges/prisma-enums";

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
  ownerMerchantUserId: string | null;
  merchantContentStatus: AdvertisementMerchantContentStatus;
  ownerMerchant: { email: string; name: string | null } | null;
};

export async function listAdvertisementsForAdminTable(): Promise<
  AdvertisementListRow[] | null
> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return null;

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
        ownerMerchantUserId: true,
        merchantContentStatus: true,
        ownerMerchant: { select: { email: true, name: true } },
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
    ownerMerchant: { select: { id: true; email: true; name: true } };
  };
}>;

export type MerchantUserOption = {
  id: string;
  email: string;
  name: string | null;
  merchantMaxAdvertisementSlots: number | null;
};

export async function listMerchantUsersForAdvertisementForm(): Promise<
  MerchantUserOption[] | null
> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return null;
  return prisma.user.findMany({
    where: { role: "merchant" },
    select: {
      id: true,
      email: true,
      name: true,
      merchantMaxAdvertisementSlots: true,
    },
    orderBy: { email: "asc" },
  });
}

export async function getAdvertisementForAdminEdit(
  id: string
): Promise<
  | { ok: true; data: AdvertisementEditRow }
  | { ok: false; reason: "auth" | "missing" }
> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) {
    return { ok: false, reason: "auth" };
  }

  const row = await prisma.advertisement.findUnique({
    where: { id },
    include: {
      targetCities: { select: { id: true } },
      partnerBadgeDefinition: { select: { id: true, title: true, imageUrl: true } },
      merchantAssignments: { select: { userId: true } },
      ownerMerchant: { select: { id: true, email: true, name: true } },
    },
  });
  if (!row) {
    return { ok: false, reason: "missing" };
  }
  return { ok: true, data: row };
}
