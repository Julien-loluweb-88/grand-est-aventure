"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperadminForAdvertisements } from "@/lib/advertisements/merchant-advertisement-authorization";
import { mergePendingAdvertisementContent } from "@/lib/advertisements/merge-pending-advertisement-content";
import {
  queueMerchantAdvertisementApprovedEmail,
  queueMerchantAdvertisementRejectedEmail,
} from "@/lib/notify-merchant-advertisement-review-result";
import { AdvertisementMerchantContentStatus } from "@/lib/badges/prisma-enums";

const REJECTION_REASON_MAX = 2000;

export async function approveMerchantAdvertisementContent(
  advertisementId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return { success: false, error: gate.error };

  const ad = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: {
      id: true,
      name: true,
      advertiserName: true,
      merchantContentStatus: true,
      ownerMerchantUserId: true,
      pendingTitle: true,
      pendingBody: true,
      pendingImageUrl: true,
      pendingTargetUrl: true,
      pendingPartnerBadgeTitle: true,
      pendingPartnerMaxRedemptionsPerUser: true,
      pendingPartnerClaimsOpen: true,
      partnerBadgeDefinitionId: true,
      partnerMaxRedemptionsPerUser: true,
      partnerClaimsOpen: true,
      partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
      ownerMerchant: { select: { email: true, name: true } },
    },
  });

  if (!ad?.ownerMerchantUserId) {
    return { success: false, error: "Cette publicité n'est pas un emplacement commerçant." };
  }
  if (ad.merchantContentStatus !== AdvertisementMerchantContentStatus.PENDING_REVIEW) {
    return { success: false, error: "Aucune soumission en attente de validation." };
  }

  const hasContent =
    Boolean(ad.pendingTitle?.trim()) ||
    Boolean(ad.pendingBody?.trim()) ||
    Boolean(ad.pendingImageUrl?.trim()) ||
    Boolean(ad.pendingTargetUrl?.trim()) ||
    ad.pendingPartnerMaxRedemptionsPerUser != null;
  if (!hasContent) {
    return { success: false, error: "Le brouillon commerçant est vide." };
  }

  await mergePendingAdvertisementContent(advertisementId, {
    pendingTitle: ad.pendingTitle,
    pendingBody: ad.pendingBody,
    pendingImageUrl: ad.pendingImageUrl,
    pendingTargetUrl: ad.pendingTargetUrl,
    pendingPartnerMaxRedemptionsPerUser: ad.pendingPartnerMaxRedemptionsPerUser,
    pendingPartnerClaimsOpen: ad.pendingPartnerClaimsOpen,
    partnerBadgeDefinitionId: ad.partnerBadgeDefinitionId,
  });

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      merchantContentStatus: AdvertisementMerchantContentStatus.APPROVED,
      active: true,
    },
  });

  if (ad.ownerMerchant?.email) {
    queueMerchantAdvertisementApprovedEmail({
      to: ad.ownerMerchant.email,
      displayName: ad.ownerMerchant.name,
      advertisementName: ad.name,
      advertisementId,
    });
  }

  revalidatePath("/admin-game/dashboard/publicites");
  revalidatePath(`/admin-game/dashboard/publicites/${advertisementId}`);
  revalidatePath("/admin-game/dashboard/commercant");
  return { success: true };
}

export async function rejectMerchantAdvertisementContent(
  advertisementId: string,
  rejectionReason: string
): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await assertSuperadminForAdvertisements();
  if (!gate.ok) return { success: false, error: gate.error };

  const reason = rejectionReason.trim();
  if (!reason) {
    return { success: false, error: "Indiquez un motif de refus." };
  }
  if (reason.length > REJECTION_REASON_MAX) {
    return {
      success: false,
      error: `Motif trop long (${REJECTION_REASON_MAX} caractères maximum).`,
    };
  }

  const ad = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: {
      id: true,
      name: true,
      merchantContentStatus: true,
      ownerMerchantUserId: true,
      ownerMerchant: { select: { email: true, name: true } },
    },
  });

  if (!ad?.ownerMerchantUserId) {
    return { success: false, error: "Cette publicité n'est pas un emplacement commerçant." };
  }
  if (ad.merchantContentStatus !== AdvertisementMerchantContentStatus.PENDING_REVIEW) {
    return { success: false, error: "Aucune soumission en attente de validation." };
  }

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      merchantContentStatus: AdvertisementMerchantContentStatus.REJECTED,
      merchantRejectionReason: reason,
    },
  });

  if (ad.ownerMerchant?.email) {
    queueMerchantAdvertisementRejectedEmail({
      to: ad.ownerMerchant.email,
      displayName: ad.ownerMerchant.name,
      advertisementName: ad.name,
      advertisementId,
      rejectionReason: reason,
    });
  }

  revalidatePath("/admin-game/dashboard/publicites");
  revalidatePath(`/admin-game/dashboard/publicites/${advertisementId}`);
  revalidatePath("/admin-game/dashboard/commercant");
  return { success: true };
}
