-- Offres partenaires : badge, demandes joueur, rattachement commerçants.

CREATE TYPE "PartnerOfferClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'PARTNER_OFFER';

ALTER TABLE "Advertisement" ADD COLUMN     "partnerBadgeDefinitionId" TEXT,
ADD COLUMN     "partnerMaxRedemptionsPerUser" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "partnerClaimsOpen" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "Advertisement_partnerBadgeDefinitionId_key" ON "Advertisement"("partnerBadgeDefinitionId");

ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_partnerBadgeDefinitionId_fkey" FOREIGN KEY ("partnerBadgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MerchantAdvertisement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantAdvertisement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantAdvertisement_userId_advertisementId_key" ON "MerchantAdvertisement"("userId", "advertisementId");

CREATE INDEX "MerchantAdvertisement_advertisementId_idx" ON "MerchantAdvertisement"("advertisementId");

ALTER TABLE "MerchantAdvertisement" ADD CONSTRAINT "MerchantAdvertisement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantAdvertisement" ADD CONSTRAINT "MerchantAdvertisement_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PartnerOfferClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "status" "PartnerOfferClaimStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerOfferClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerOfferClaim_advertisementId_status_idx" ON "PartnerOfferClaim"("advertisementId", "status");

CREATE INDEX "PartnerOfferClaim_userId_advertisementId_idx" ON "PartnerOfferClaim"("userId", "advertisementId");

CREATE INDEX "PartnerOfferClaim_status_createdAt_idx" ON "PartnerOfferClaim"("status", "createdAt");

ALTER TABLE "PartnerOfferClaim" ADD CONSTRAINT "PartnerOfferClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerOfferClaim" ADD CONSTRAINT "PartnerOfferClaim_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerOfferClaim" ADD CONSTRAINT "PartnerOfferClaim_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
