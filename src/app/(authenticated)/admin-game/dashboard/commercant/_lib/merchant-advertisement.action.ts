"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getMerchantActorForAuthorization,
  merchantOwnsAdvertisement,
} from "@/lib/advertisements/merchant-advertisement-authorization";
import { merchantCanEditAdvertisementContent } from "@/lib/advertisements/merchant-advertisement-labels";
import { notifySuperadminsAdvertisementPendingReview } from "@/lib/notify-superadmins-advertisement-pending-review";
import { finalizeAdvertisementDraftImageUrl } from "@/lib/uploads/finalize-advertisement-draft-image";
import { AdvertisementMerchantContentStatus } from "@/lib/badges/prisma-enums";
import {
  ADVERTISEMENT_BODY_MAX_CHARS,
  ADVERTISEMENT_TITLE_MAX_CHARS,
} from "@/lib/dashboard-text-limits";

export type MerchantAdvertisementContentInput = {
  title: string;
  body: string;
  imageUrl: string;
  targetUrl: string;
  /** Active les validations joueur (nom du badge = superadmin). */
  partnerOfferEnabled: boolean;
  partnerMaxRedemptionsPerUser: number;
  partnerClaimsOpen: boolean;
  advertisementImageDraftId?: string | null;
};

function clampText(s: string, max: number): string {
  return s.trim().slice(0, max);
}

async function loadOwnedAdvertisement(advertisementId: string, merchantUserId: string) {
  return prisma.advertisement.findFirst({
    where: { id: advertisementId, ownerMerchantUserId: merchantUserId },
    select: {
      id: true,
      name: true,
      merchantContentStatus: true,
    },
  });
}

export async function saveMerchantAdvertisementDraft(
  advertisementId: string,
  input: MerchantAdvertisementContentInput
): Promise<{ success: true } | { success: false; error: string }> {
  const actor = await getMerchantActorForAuthorization();
  if (!actor) return { success: false, error: "Non autorisé." };
  if (!(await merchantOwnsAdvertisement(actor.id, advertisementId))) {
    return { success: false, error: "Publicité introuvable." };
  }

  const ad = await loadOwnedAdvertisement(advertisementId, actor.id);
  if (!ad) return { success: false, error: "Publicité introuvable." };
  if (!merchantCanEditAdvertisementContent(ad.merchantContentStatus)) {
    return { success: false, error: "Modification impossible dans l'état actuel." };
  }
  if (ad.merchantContentStatus === AdvertisementMerchantContentStatus.PENDING_REVIEW) {
    return { success: false, error: "Une soumission est déjà en cours de validation." };
  }

  let imageUrl = clampText(input.imageUrl, 2048) || null;
  const draftId = input.advertisementImageDraftId?.trim();

  if (draftId && imageUrl) {
    const finalUrl = await finalizeAdvertisementDraftImageUrl({
      draftId,
      advertisementId,
      imageUrl,
    });
    if (finalUrl) imageUrl = finalUrl;
  }

  const nextStatus =
    ad.merchantContentStatus === AdvertisementMerchantContentStatus.SLOT_EMPTY
      ? AdvertisementMerchantContentStatus.DRAFT
      : ad.merchantContentStatus === AdvertisementMerchantContentStatus.APPROVED
        ? AdvertisementMerchantContentStatus.APPROVED
        : AdvertisementMerchantContentStatus.DRAFT;

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      pendingTitle: clampText(input.title, ADVERTISEMENT_TITLE_MAX_CHARS) || null,
      pendingBody: clampText(input.body, ADVERTISEMENT_BODY_MAX_CHARS) || null,
      pendingImageUrl: imageUrl,
      pendingTargetUrl: clampText(input.targetUrl, 2048) || null,
      pendingPartnerBadgeTitle: null,
      pendingPartnerMaxRedemptionsPerUser: input.partnerOfferEnabled
        ? Math.min(
            100,
            Math.max(1, Math.floor(Number(input.partnerMaxRedemptionsPerUser) || 1))
          )
        : null,
      pendingPartnerClaimsOpen: input.partnerOfferEnabled ? input.partnerClaimsOpen : false,
      merchantContentStatus: nextStatus,
      merchantRejectionReason: null,
    },
  });

  revalidatePath("/admin-game/dashboard/commercant");
  revalidatePath(`/admin-game/dashboard/commercant/publicites/${advertisementId}`);
  return { success: true };
}

export async function submitMerchantAdvertisementForReview(
  advertisementId: string,
  input: MerchantAdvertisementContentInput
): Promise<{ success: true } | { success: false; error: string }> {
  const save = await saveMerchantAdvertisementDraft(advertisementId, input);
  if (!save.success) return save;

  const actor = await getMerchantActorForAuthorization();
  if (!actor) return { success: false, error: "Non autorisé." };

  const ad = await prisma.advertisement.findFirst({
    where: { id: advertisementId, ownerMerchantUserId: actor.id },
    select: {
      id: true,
      name: true,
      merchantContentStatus: true,
      pendingTitle: true,
      pendingBody: true,
      pendingImageUrl: true,
      pendingTargetUrl: true,
      pendingPartnerClaimsOpen: true,
      partnerBadgeDefinitionId: true,
      partnerBadgeDefinition: { select: { title: true, imageUrl: true } },
    },
  });
  if (!ad) return { success: false, error: "Publicité introuvable." };

  const hasPubContent =
    Boolean(ad.pendingTitle?.trim()) ||
    Boolean(ad.pendingBody?.trim()) ||
    Boolean(ad.pendingImageUrl?.trim()) ||
    Boolean(ad.pendingTargetUrl?.trim());
  if (!hasPubContent) {
    return {
      success: false,
      error:
        "Renseignez au moins un élément du contenu publicitaire (titre, texte, image ou lien). L'offre partenaire est optionnelle.",
    };
  }

  if (input.partnerOfferEnabled) {
    const hasBadge =
      ad.partnerBadgeDefinitionId &&
      (ad.partnerBadgeDefinition?.title?.trim() ||
        ad.partnerBadgeDefinition?.imageUrl?.trim());
    if (!hasBadge) {
      return {
        success: false,
        error:
          "L'offre partenaire est activée mais le badge n'est pas encore configuré par l'équipe Balad'indice. Désactivez l'offre ou contactez l'équipe.",
      };
    }
  }

  await prisma.advertisement.update({
    where: { id: advertisementId },
    data: {
      merchantContentStatus: AdvertisementMerchantContentStatus.PENDING_REVIEW,
    },
  });

  const merchant = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { email: true, name: true },
  });

  try {
    if (merchant?.email) {
      await notifySuperadminsAdvertisementPendingReview({
        advertisementId,
        advertisementName: ad.name,
        merchantName: merchant.name,
        merchantEmail: merchant.email,
      });
    }
  } catch (e) {
    console.error("[merchant ad submit] notification superadmins:", e);
  }

  revalidatePath("/admin-game/dashboard/publicites");
  revalidatePath(`/admin-game/dashboard/publicites/${advertisementId}`);
  revalidatePath("/admin-game/dashboard/commercant");
  revalidatePath(`/admin-game/dashboard/commercant/publicites/${advertisementId}`);
  return { success: true };
}
