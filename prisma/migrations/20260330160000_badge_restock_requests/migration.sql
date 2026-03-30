-- Demandes de réassort (admin → superadmin).

CREATE TYPE "AdventureBadgeRestockRequestStatus" AS ENUM ('PENDING', 'CLOSED');

CREATE TABLE "AdventureBadgeRestockRequest" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "quantityRequested" INTEGER,
    "status" "AdventureBadgeRestockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,

    CONSTRAINT "AdventureBadgeRestockRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdventureBadgeRestockRequest_adventureId_status_idx" ON "AdventureBadgeRestockRequest"("adventureId", "status");
CREATE INDEX "AdventureBadgeRestockRequest_status_createdAt_idx" ON "AdventureBadgeRestockRequest"("status", "createdAt");

ALTER TABLE "AdventureBadgeRestockRequest" ADD CONSTRAINT "AdventureBadgeRestockRequest_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdventureBadgeRestockRequest" ADD CONSTRAINT "AdventureBadgeRestockRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdventureBadgeRestockRequest" ADD CONSTRAINT "AdventureBadgeRestockRequest_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
