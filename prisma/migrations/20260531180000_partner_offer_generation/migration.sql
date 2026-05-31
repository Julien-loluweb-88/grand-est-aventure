-- Nouveau cycle de validations quand la promo pub change (titre, texte, image).

ALTER TABLE "Advertisement" ADD COLUMN "partnerOfferGeneration" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PartnerOfferClaim" ADD COLUMN "offerGeneration" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "PartnerOfferClaim_userId_advertisementId_offerGeneration_idx"
  ON "PartnerOfferClaim"("userId", "advertisementId", "offerGeneration");
