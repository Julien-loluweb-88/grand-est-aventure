import "server-only";

import { PartnerOfferClaimStatus } from "../../../generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PARTNER_CLAIM_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export async function merchantManagesAdvertisement(
  merchantUserId: string,
  advertisementId: string
): Promise<boolean> {
  const row = await prisma.merchantAdvertisement.findUnique({
    where: {
      userId_advertisementId: { userId: merchantUserId, advertisementId },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export function advertisementIsInDisplayWindow(ad: {
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}, now: Date): boolean {
  if (!ad.active) return false;
  if (ad.startsAt != null && ad.startsAt > now) return false;
  if (ad.endsAt != null && ad.endsAt < now) return false;
  return true;
}

export function advertisementAcceptsNewPartnerClaims(ad: {
  partnerBadgeDefinitionId: string | null;
  partnerClaimsOpen: boolean;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}, now: Date): boolean {
  if (!ad.partnerBadgeDefinitionId || !ad.partnerClaimsOpen) return false;
  return advertisementIsInDisplayWindow(ad, now);
}

export async function expireStalePartnerOfferClaims(now = new Date()) {
  const cutoff = new Date(now.getTime() - PARTNER_CLAIM_EXPIRATION_MS);
  const result = await prisma.partnerOfferClaim.updateMany({
    where: {
      status: PartnerOfferClaimStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    data: { status: PartnerOfferClaimStatus.EXPIRED },
  });
  return { count: result.count };
}

export async function createPartnerOfferClaim(input: {
  userId: string;
  advertisementId: string;
}): Promise<
  | { ok: true; claimId: string }
  | { ok: false; error: string; status?: number }
> {
  const now = new Date();
  const ad = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: {
      id: true,
      active: true,
      startsAt: true,
      endsAt: true,
      partnerBadgeDefinitionId: true,
      partnerClaimsOpen: true,
      partnerMaxRedemptionsPerUser: true,
    },
  });
  if (!ad) {
    return { ok: false, error: "Publicité introuvable.", status: 404 };
  }
  if (!advertisementAcceptsNewPartnerClaims(ad, now)) {
    return {
      ok: false,
      error: "Cette offre n’accepte pas de nouvelles demandes pour le moment.",
      status: 400,
    };
  }

  const maxR = Math.max(1, ad.partnerMaxRedemptionsPerUser);
  const [pending, approvedCount] = await Promise.all([
    prisma.partnerOfferClaim.findFirst({
      where: {
        userId: input.userId,
        advertisementId: input.advertisementId,
        status: PartnerOfferClaimStatus.PENDING,
      },
      select: { id: true },
    }),
    prisma.partnerOfferClaim.count({
      where: {
        userId: input.userId,
        advertisementId: input.advertisementId,
        status: PartnerOfferClaimStatus.APPROVED,
      },
    }),
  ]);

  if (pending) {
    return {
      ok: false,
      error: "Une demande est déjà en attente pour cette offre.",
      status: 400,
    };
  }
  if (approvedCount >= maxR) {
    return {
      ok: false,
      error: "Vous avez déjà atteint le nombre maximum de validations pour cette offre.",
      status: 400,
    };
  }

  const claim = await prisma.partnerOfferClaim.create({
    data: {
      userId: input.userId,
      advertisementId: input.advertisementId,
      status: PartnerOfferClaimStatus.PENDING,
    },
    select: { id: true },
  });
  return { ok: true, claimId: claim.id };
}

export async function resolvePartnerOfferClaim(input: {
  claimId: string;
  merchantUserId: string;
  action: "approve" | "reject";
  rejectionReason?: string | null;
}): Promise<
  | {
      ok: true;
      status: PartnerOfferClaimStatus;
      awardedUserBadge: boolean;
    }
  | { ok: false; error: string; status: number }
> {
  const claim = await prisma.partnerOfferClaim.findUnique({
    where: { id: input.claimId },
    include: {
      advertisement: {
        select: {
          id: true,
          partnerBadgeDefinitionId: true,
          partnerMaxRedemptionsPerUser: true,
        },
      },
    },
  });
  if (!claim) {
    return { ok: false, error: "Demande introuvable.", status: 404 };
  }
  if (claim.status !== PartnerOfferClaimStatus.PENDING) {
    return { ok: false, error: "Cette demande n’est plus en attente.", status: 400 };
  }

  const canManage = await merchantManagesAdvertisement(
    input.merchantUserId,
    claim.advertisementId
  );
  if (!canManage) {
    return { ok: false, error: "Non autorisé pour cette publicité.", status: 403 };
  }

  if (input.action === "reject") {
    await prisma.partnerOfferClaim.update({
      where: { id: input.claimId },
      data: {
        status: PartnerOfferClaimStatus.REJECTED,
        resolvedAt: new Date(),
        resolvedByUserId: input.merchantUserId,
        rejectionReason: input.rejectionReason?.trim() || null,
      },
    });
    return {
      ok: true,
      status: PartnerOfferClaimStatus.REJECTED,
      awardedUserBadge: false,
    };
  }

  const ad = claim.advertisement;
  if (!ad.partnerBadgeDefinitionId) {
    return { ok: false, error: "Offre sans badge configuré.", status: 400 };
  }

  const maxR = Math.max(1, ad.partnerMaxRedemptionsPerUser);
  const approvedCount = await prisma.partnerOfferClaim.count({
    where: {
      userId: claim.userId,
      advertisementId: claim.advertisementId,
      status: PartnerOfferClaimStatus.APPROVED,
    },
  });
  if (approvedCount >= maxR) {
    return {
      ok: false,
      error: "Le joueur a déjà atteint le plafond de validations pour cette offre.",
      status: 400,
    };
  }

  const badgeId = ad.partnerBadgeDefinitionId;

  const awardedUserBadge = await prisma.$transaction(async (tx) => {
    const hadBadge = await tx.userBadge.findUnique({
      where: {
        userId_badgeDefinitionId: {
          userId: claim.userId,
          badgeDefinitionId: badgeId,
        },
      },
      select: { id: true },
    });
    await tx.partnerOfferClaim.update({
      where: { id: input.claimId },
      data: {
        status: PartnerOfferClaimStatus.APPROVED,
        resolvedAt: new Date(),
        resolvedByUserId: input.merchantUserId,
        rejectionReason: null,
      },
    });
    await tx.userBadge.upsert({
      where: {
        userId_badgeDefinitionId: {
          userId: claim.userId,
          badgeDefinitionId: badgeId,
        },
      },
      create: { userId: claim.userId, badgeDefinitionId: badgeId },
      update: {},
    });
    return !hadBadge;
  });

  return {
    ok: true,
    status: PartnerOfferClaimStatus.APPROVED,
    awardedUserBadge,
  };
}
