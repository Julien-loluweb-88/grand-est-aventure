import {
  AdvertisementMerchantContentStatus,
  type AdvertisementMerchantContentStatusValue,
} from "@/lib/advertisements/merchant-advertisement-status";

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
