/** Valeurs stables du workflow contenu commerçant — utilisable côté client (sans Prisma). */
export const AdvertisementMerchantContentStatus = {
  SLOT_EMPTY: "SLOT_EMPTY",
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type AdvertisementMerchantContentStatusValue =
  (typeof AdvertisementMerchantContentStatus)[keyof typeof AdvertisementMerchantContentStatus];
