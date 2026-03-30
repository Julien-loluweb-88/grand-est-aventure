-- Journal opérationnel : réassort et incidents sur le stock physique (motif dans `note`).

CREATE TYPE "AdventureBadgeStockEventKind" AS ENUM ('INITIAL_SETUP', 'RESTOCK', 'LOSS_INCIDENT');

CREATE TABLE "AdventureBadgeStockEvent" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "kind" "AdventureBadgeStockEventKind" NOT NULL,
    "availableDelta" INTEGER NOT NULL,
    "availableAfter" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdventureBadgeStockEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdventureBadgeStockEvent_adventureId_createdAt_idx" ON "AdventureBadgeStockEvent"("adventureId", "createdAt");

ALTER TABLE "AdventureBadgeStockEvent" ADD CONSTRAINT "AdventureBadgeStockEvent_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdventureBadgeStockEvent" ADD CONSTRAINT "AdventureBadgeStockEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
