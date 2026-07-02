import "server-only";

import { prisma } from "@/lib/prisma";
import { PartnerOfferClaimStatus } from "@/lib/badges/prisma-enums";
import { resolvePartnerBadgeImageUrl } from "@/lib/advertisements/resolve-partner-badge-image-url";

export type MerchantPartnerClaimListItem = {
  id: string;
  advertisementId: string;
  status: PartnerOfferClaimStatus;
  createdAt: string;
  resolvedAt: string | null;
  rejectionReason: string | null;
  player: {
    id: string;
    name: string | null;
    email: string;
  };
  advertisement: {
    id: string;
    name: string;
    advertiserName: string;
    title: string | null;
    badgeTitle: string | null;
    badgeImageUrl: string | null;
  };
};

const VALID_STATUSES = new Set<PartnerOfferClaimStatus>([
  PartnerOfferClaimStatus.PENDING,
  PartnerOfferClaimStatus.APPROVED,
  PartnerOfferClaimStatus.REJECTED,
  PartnerOfferClaimStatus.EXPIRED,
]);

export function parseMerchantPartnerClaimStatus(
  raw: string | null | undefined
): PartnerOfferClaimStatus {
  const t = (raw ?? "PENDING").trim().toUpperCase();
  if (VALID_STATUSES.has(t as PartnerOfferClaimStatus)) {
    return t as PartnerOfferClaimStatus;
  }
  return PartnerOfferClaimStatus.PENDING;
}

/** Demandes d’offres pour les publicités gérées par ce commerçant. */
export async function listPartnerClaimsForMerchant(
  merchantUserId: string,
  status: PartnerOfferClaimStatus
): Promise<MerchantPartnerClaimListItem[]> {
  const assignments = await prisma.merchantAdvertisement.findMany({
    where: { userId: merchantUserId },
    select: { advertisementId: true },
  });
  const adIds = assignments.map((a) => a.advertisementId);
  if (adIds.length === 0) {
    return [];
  }

  const claims = await prisma.partnerOfferClaim.findMany({
    where: {
      advertisementId: { in: adIds },
      status,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      advertisement: {
        select: {
          id: true,
          advertiserName: true,
          title: true,
          name: true,
          imageUrl: true,
          partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
        },
      },
    },
  });

  return claims.map((c) => {
    const ad = c.advertisement;
    const badgeImageUrl = resolvePartnerBadgeImageUrl({
      advertisementImageUrl: ad.imageUrl,
      badgeDefinitionImageUrl: ad.partnerBadgeDefinition?.imageUrl,
    });
    return {
      id: c.id,
      advertisementId: c.advertisementId,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
      rejectionReason: c.rejectionReason,
      player: {
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
      },
      advertisement: {
        id: ad.id,
        name: ad.name,
        advertiserName: ad.advertiserName,
        title: ad.title,
        badgeTitle: ad.partnerBadgeDefinition?.title ?? null,
        badgeImageUrl,
      },
    };
  });
}
