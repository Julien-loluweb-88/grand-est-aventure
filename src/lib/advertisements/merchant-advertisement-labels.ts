import {
  AdvertisementMerchantContentStatus,
  type AdvertisementMerchantContentStatusValue,
} from "@/lib/advertisements/merchant-advertisement-status";
import { hasAdvertisementLiveDisplayContent } from "@/lib/advertisements/advertisement-player-visibility";

const LABELS: Record<AdvertisementMerchantContentStatusValue, string> = {
  SLOT_EMPTY: "Emplacement vide",
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En attente de validation",
  APPROVED: "Validé",
  REJECTED: "Refusé",
};

export function labelForAdvertisementMerchantContentStatus(
  status: AdvertisementMerchantContentStatusValue
): string {
  return LABELS[status] ?? status;
}

export function merchantCanEditAdvertisementContent(
  status: AdvertisementMerchantContentStatusValue
): boolean {
  return (
    status === AdvertisementMerchantContentStatus.SLOT_EMPTY ||
    status === AdvertisementMerchantContentStatus.DRAFT ||
    status === AdvertisementMerchantContentStatus.REJECTED ||
    status === AdvertisementMerchantContentStatus.APPROVED
  );
}

export function merchantCanSubmitAdvertisementContent(
  status: AdvertisementMerchantContentStatusValue
): boolean {
  return (
    status === AdvertisementMerchantContentStatus.SLOT_EMPTY ||
    status === AdvertisementMerchantContentStatus.DRAFT ||
    status === AdvertisementMerchantContentStatus.REJECTED ||
    status === AdvertisementMerchantContentStatus.APPROVED
  );
}

/**
 * Quand le superadmin remplit le contenu live sur la fiche pub (hors file commerçant),
 * l’emplacement passe en « Validé » pour l’affichage joueur et la liste admin.
 */
export function merchantContentStatusAfterSuperadminLivePublish(
  currentStatus: AdvertisementMerchantContentStatusValue,
  live: {
    title: string | null;
    body: string | null;
    imageUrl: string | null;
    targetUrl: string | null;
  }
): AdvertisementMerchantContentStatusValue | undefined {
  if (!hasAdvertisementLiveDisplayContent(live)) {
    return undefined;
  }
  if (
    currentStatus === AdvertisementMerchantContentStatus.SLOT_EMPTY ||
    currentStatus === AdvertisementMerchantContentStatus.DRAFT ||
    currentStatus === AdvertisementMerchantContentStatus.REJECTED
  ) {
    return AdvertisementMerchantContentStatus.APPROVED;
  }
  return undefined;
}
