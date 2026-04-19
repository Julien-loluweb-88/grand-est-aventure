-- Utilisation unique en magasin + textes règlement roue + index redemption.

ALTER TABLE "UserAdventurePartnerLotWin" ADD COLUMN "redeemedAt" TIMESTAMP(3);
CREATE INDEX "UserAdventurePartnerLotWin_redeemedAt_idx" ON "UserAdventurePartnerLotWin"("redeemedAt");

ALTER TABLE "Adventure" ADD COLUMN "partnerWheelTerms" TEXT;
ALTER TABLE "City" ADD COLUMN "partnerWheelTerms" TEXT;
