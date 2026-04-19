-- Lots roue partenaires (fin d'aventure) + gains joueur.

CREATE TABLE "AdventurePartnerLot" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "redemptionHint" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "quantityRemaining" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "adventureId" TEXT,
    "cityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdventurePartnerLot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdventurePartnerLot_scope_chk" CHECK ("adventureId" IS NOT NULL OR "cityId" IS NOT NULL)
);

CREATE TABLE "UserAdventurePartnerLotWin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "adventurePartnerLotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAdventurePartnerLotWin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAdventurePartnerLotWin_userId_adventureId_key" ON "UserAdventurePartnerLotWin"("userId", "adventureId");
CREATE INDEX "AdventurePartnerLot_adventureId_active_idx" ON "AdventurePartnerLot"("adventureId", "active");
CREATE INDEX "AdventurePartnerLot_cityId_active_idx" ON "AdventurePartnerLot"("cityId", "active");
CREATE INDEX "UserAdventurePartnerLotWin_adventureId_idx" ON "UserAdventurePartnerLotWin"("adventureId");

ALTER TABLE "AdventurePartnerLot" ADD CONSTRAINT "AdventurePartnerLot_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdventurePartnerLot" ADD CONSTRAINT "AdventurePartnerLot_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAdventurePartnerLotWin" ADD CONSTRAINT "UserAdventurePartnerLotWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAdventurePartnerLotWin" ADD CONSTRAINT "UserAdventurePartnerLotWin_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAdventurePartnerLotWin" ADD CONSTRAINT "UserAdventurePartnerLotWin_adventurePartnerLotId_fkey" FOREIGN KEY ("adventurePartnerLotId") REFERENCES "AdventurePartnerLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
