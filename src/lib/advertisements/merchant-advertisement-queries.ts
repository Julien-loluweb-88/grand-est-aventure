import "server-only";

import { prisma } from "@/lib/prisma";
import { assertSuperadminForAdvertisements } from "@/lib/advertisements/merchant-advertisement-authorization";
import { getMerchantActorForAuthorization } from "@/lib/advertisements/merchant-advertisement-authorization";
import { AdvertisementMerchantContentStatus } from "@/lib/badges/prisma-enums";
import type { Prisma } from "../../../generated/prisma/client";

export type MerchantAdvertisementListItem = {
  id: string;
  name: string;
  advertiserName: string;
  placement: string;
  merchantContentStatus: AdvertisementMerchantContentStatus;
  active: boolean;
  merchantRejectionReason: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

export async function listMerchantOwnedAdvertisements(): Promise<
  MerchantAdvertisementListItem[] | null
> {
  const actor = await getMerchantActorForAuthorization();
  if (!actor) return null;

  return prisma.advertisement.findMany({
    where: { ownerMerchantUserId: actor.id },
    select: {
      id: true,
      name: true,
      advertiserName: true,
      placement: true,
      merchantContentStatus: true,
      active: true,
      merchantRejectionReason: true,
      startsAt: true,
      endsAt: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export type MerchantAdvertisementEditRow = Prisma.AdvertisementGetPayload<{
  select: {
    id: true;
    name: true;
    advertiserName: true;
    placement: true;
    merchantContentStatus: true;
    merchantRejectionReason: true;
    active: true;
    startsAt: true;
    endsAt: true;
    title: true;
    body: true;
    imageUrl: true;
    targetUrl: true;
    partnerMaxRedemptionsPerUser: true;
    partnerClaimsOpen: true;
    partnerBadgeDefinitionId: true;
    partnerBadgeDefinition: { select: { title: true; imageUrl: true } };
    pendingTitle: true;
    pendingBody: true;
    pendingImageUrl: true;
    pendingTargetUrl: true;
    pendingPartnerBadgeTitle: true;
    pendingPartnerBadgeImageUrl: true;
    pendingPartnerMaxRedemptionsPerUser: true;
    pendingPartnerClaimsOpen: true;
  };
}>;

export async function getMerchantAdvertisementForEdit(
  id: string
): Promise<
  | { ok: true; data: MerchantAdvertisementEditRow }
  | { ok: false; reason: "auth" | "missing" }
> {
  const actor = await getMerchantActorForAuthorization();
  if (!actor) return { ok: false, reason: "auth" };

  const row = await prisma.advertisement.findFirst({
    where: { id, ownerMerchantUserId: actor.id },
    select: {
      id: true,
      name: true,
      advertiserName: true,
      placement: true,
      merchantContentStatus: true,
      merchantRejectionReason: true,
      active: true,
      startsAt: true,
      endsAt: true,
      title: true,
      body: true,
      imageUrl: true,
      targetUrl: true,
      partnerMaxRedemptionsPerUser: true,
      partnerClaimsOpen: true,
      partnerBadgeDefinitionId: true,
      partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
      pendingTitle: true,
      pendingBody: true,
      pendingImageUrl: true,
      pendingTargetUrl: true,
      pendingPartnerBadgeTitle: true,
      pendingPartnerBadgeImageUrl: true,
      pendingPartnerMaxRedemptionsPerUser: true,
      pendingPartnerClaimsOpen: true,
    },
  });
  if (!row) return { ok: false, reason: "missing" };
  return { ok: true, data: row };
}

export async function countPendingMerchantAdvertisementReviews(): Promise<number | null> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return null;
  return prisma.advertisement.count({
    where: {
      merchantContentStatus: AdvertisementMerchantContentStatus.PENDING_REVIEW,
      ownerMerchantUserId: { not: null },
    },
  });
}
