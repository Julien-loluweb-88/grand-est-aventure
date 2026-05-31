-- Emplacements publicitaires commerçants : quota, propriétaire, workflow validation.

CREATE TYPE "AdvertisementMerchantContentStatus" AS ENUM (
  'SLOT_EMPTY',
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED'
);

ALTER TABLE "user" ADD COLUMN "merchantMaxAdvertisementSlots" INTEGER;

ALTER TABLE "Advertisement" ADD COLUMN     "ownerMerchantUserId" TEXT,
ADD COLUMN     "merchantContentStatus" "AdvertisementMerchantContentStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "merchantRejectionReason" TEXT,
ADD COLUMN     "pendingTitle" TEXT,
ADD COLUMN     "pendingBody" TEXT,
ADD COLUMN     "pendingImageUrl" TEXT,
ADD COLUMN     "pendingTargetUrl" TEXT,
ADD COLUMN     "pendingPartnerBadgeTitle" TEXT,
ADD COLUMN     "pendingPartnerBadgeImageUrl" TEXT,
ADD COLUMN     "pendingPartnerMaxRedemptionsPerUser" INTEGER,
ADD COLUMN     "pendingPartnerClaimsOpen" BOOLEAN;

CREATE INDEX "Advertisement_ownerMerchantUserId_idx" ON "Advertisement"("ownerMerchantUserId");

CREATE INDEX "Advertisement_merchantContentStatus_idx" ON "Advertisement"("merchantContentStatus");

ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_ownerMerchantUserId_fkey" FOREIGN KEY ("ownerMerchantUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
