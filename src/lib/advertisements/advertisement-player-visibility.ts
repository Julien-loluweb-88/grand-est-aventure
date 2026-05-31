import { AdvertisementMerchantContentStatus } from "@/lib/advertisements/merchant-advertisement-status";

type AdvertisementDisplayFields = {
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
};

/** Contenu pub « live » suffisant pour afficher un encart joueur. */
export function hasAdvertisementLiveDisplayContent(
  ad: AdvertisementDisplayFields
): boolean {
  return Boolean(
    ad.title?.trim() ||
      ad.body?.trim() ||
      ad.imageUrl?.trim() ||
      ad.targetUrl?.trim()
  );
}

/**
 * Éligibilité contenu côté joueur (hors geo / dismissals).
 * Les emplacements commerçant vides ou en brouillon ne sortent pas ;
 * en re-modération (`PENDING_REVIEW`) ou refus avec version live, l’ancien contenu reste visible.
 */
export function isAdvertisementVisibleToPlayer(ad: {
  active: boolean;
  merchantContentStatus: string;
  ownerMerchantUserId: string | null;
} & AdvertisementDisplayFields): boolean {
  if (!ad.active) return false;
  if (!hasAdvertisementLiveDisplayContent(ad)) return false;

  const status = ad.merchantContentStatus;
  if (
    status === AdvertisementMerchantContentStatus.SLOT_EMPTY ||
    status === AdvertisementMerchantContentStatus.DRAFT
  ) {
    return false;
  }

  if (!ad.ownerMerchantUserId) {
    return true;
  }

  return (
    status === AdvertisementMerchantContentStatus.APPROVED ||
    status === AdvertisementMerchantContentStatus.PENDING_REVIEW ||
    status === AdvertisementMerchantContentStatus.REJECTED
  );
}
