import "server-only";

import { PartnerOfferClaimStatus } from "@/lib/badges/prisma-enums";
import { prisma } from "@/lib/prisma";

export type PendingAdvertisementContent = {
  pendingTitle: string | null;
  pendingBody: string | null;
  pendingImageUrl: string | null;
  pendingTargetUrl: string | null;
  pendingPartnerMaxRedemptionsPerUser: number | null;
  pendingPartnerClaimsOpen: boolean | null;
  partnerBadgeDefinitionId: string | null;
};

function normalizeContentField(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/**
 * Applique le brouillon commerçant : contenu pub + réglages offre (si activée).
 * Le nom et l'image du badge restent gérés par le superadmin uniquement.
 * Si le contenu pub change, `partnerOfferGeneration` augmente : les joueurs peuvent
 * à nouveau bénéficier de la nouvelle promo (plafond réinitialisé pour ce cycle).
 */
export async function mergePendingAdvertisementContent(
  advertisementId: string,
  pending: PendingAdvertisementContent
): Promise<void> {
  const live = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: {
      title: true,
      body: true,
      imageUrl: true,
      partnerOfferGeneration: true,
    },
  });

  const title = pending.pendingTitle?.trim() || null;
  const body = pending.pendingBody?.trim() || null;
  const imageUrl = pending.pendingImageUrl?.trim() || null;
  const targetUrl = pending.pendingTargetUrl?.trim() || null;

  const contentChanged =
    live != null &&
    (normalizeContentField(title) !== normalizeContentField(live.title) ||
      normalizeContentField(body) !== normalizeContentField(live.body) ||
      normalizeContentField(imageUrl) !== normalizeContentField(live.imageUrl));

  const nextOfferGeneration =
    live != null && contentChanged
      ? live.partnerOfferGeneration + 1
      : (live?.partnerOfferGeneration ?? 0);

  const hasMerchantOffer =
    pending.pendingPartnerMaxRedemptionsPerUser != null &&
    pending.partnerBadgeDefinitionId != null;

  const maxR = Math.min(
    100,
    Math.max(1, Math.floor(Number(pending.pendingPartnerMaxRedemptionsPerUser) || 1))
  );
  const claimsOpen = hasMerchantOffer ? (pending.pendingPartnerClaimsOpen ?? true) : false;

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      title,
      body,
      imageUrl,
      targetUrl,
      partnerOfferGeneration: nextOfferGeneration,
      partnerMaxRedemptionsPerUser: hasMerchantOffer ? maxR : 1,
      partnerClaimsOpen: claimsOpen,
      pendingTitle: null,
      pendingBody: null,
      pendingImageUrl: null,
      pendingTargetUrl: null,
      pendingPartnerBadgeTitle: null,
      pendingPartnerBadgeImageUrl: null,
      pendingPartnerMaxRedemptionsPerUser: null,
      pendingPartnerClaimsOpen: null,
      merchantRejectionReason: null,
    },
  });

  if (contentChanged && nextOfferGeneration > 0) {
    await prisma.partnerOfferClaim.updateMany({
      where: {
        advertisementId,
        status: PartnerOfferClaimStatus.PENDING,
        offerGeneration: { lt: nextOfferGeneration },
      },
      data: { status: PartnerOfferClaimStatus.EXPIRED },
    });
  }
}
