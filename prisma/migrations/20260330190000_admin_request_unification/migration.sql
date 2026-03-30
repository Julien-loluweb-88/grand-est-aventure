-- CreateEnum
CREATE TYPE "AdminRequestStatus" AS ENUM ('PENDING', 'CLOSED');

-- CreateTable
CREATE TABLE "AdminRequestType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminRequestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRequest" (
    "id" TEXT NOT NULL,
    "requestTypeId" TEXT NOT NULL,
    "status" "AdminRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT NOT NULL,
    "adventureId" TEXT,
    "message" TEXT,
    "payload" JSONB,
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminRequestType_key_key" ON "AdminRequestType"("key");
CREATE INDEX "AdminRequestType_isActive_idx" ON "AdminRequestType"("isActive");
CREATE INDEX "AdminRequest_requestTypeId_status_createdAt_idx" ON "AdminRequest"("requestTypeId", "status", "createdAt");
CREATE INDEX "AdminRequest_requesterId_status_createdAt_idx" ON "AdminRequest"("requesterId", "status", "createdAt");
CREATE INDEX "AdminRequest_adventureId_status_createdAt_idx" ON "AdminRequest"("adventureId", "status", "createdAt");
CREATE INDEX "AdminRequest_status_createdAt_idx" ON "AdminRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminRequestType" ADD CONSTRAINT "AdminRequestType_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "AdminRequestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default request types
INSERT INTO "AdminRequestType" ("id", "key", "label", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('reqtype_adventure_creation', 'adventure_creation', 'Création d’aventure', 'Demande d’un admin pour créer une nouvelle aventure.', true, NOW(), NOW()),
  ('reqtype_badge_restock', 'badge_restock', 'Réassort badges', 'Demande d’ajout de stock de badges physiques sur une aventure.', true, NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;

-- Migrate data from legacy request tables
INSERT INTO "AdminRequest" (
  "id",
  "requestTypeId",
  "status",
  "requesterId",
  "adventureId",
  "message",
  "payload",
  "closedAt",
  "closedByUserId",
  "createdAt",
  "updatedAt"
)
SELECT
  acr."id",
  art."id",
  CASE WHEN lower(acr."status") = 'pending' THEN 'PENDING'::"AdminRequestStatus" ELSE 'CLOSED'::"AdminRequestStatus" END,
  acr."requesterId",
  NULL,
  acr."message",
  NULL,
  CASE WHEN lower(acr."status") = 'pending' THEN NULL ELSE acr."updatedAt" END,
  NULL,
  acr."createdAt",
  acr."updatedAt"
FROM "AdventureCreationRequest" acr
JOIN "AdminRequestType" art ON art."key" = 'adventure_creation'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "AdminRequest" (
  "id",
  "requestTypeId",
  "status",
  "requesterId",
  "adventureId",
  "message",
  "payload",
  "closedAt",
  "closedByUserId",
  "createdAt",
  "updatedAt"
)
SELECT
  arr."id",
  art."id",
  CASE WHEN arr."status" = 'PENDING' THEN 'PENDING'::"AdminRequestStatus" ELSE 'CLOSED'::"AdminRequestStatus" END,
  arr."requesterId",
  arr."adventureId",
  arr."message",
  CASE
    WHEN arr."quantityRequested" IS NULL THEN NULL
    ELSE jsonb_build_object('quantityRequested', arr."quantityRequested")
  END,
  arr."closedAt",
  arr."closedByUserId",
  arr."createdAt",
  arr."createdAt"
FROM "AdventureBadgeRestockRequest" arr
JOIN "AdminRequestType" art ON art."key" = 'badge_restock'
ON CONFLICT ("id") DO NOTHING;

-- Drop legacy request objects (now replaced by AdminRequest + AdminRequestType)
DROP TABLE IF EXISTS "AdventureBadgeRestockRequest";
DROP TYPE IF EXISTS "AdventureBadgeRestockRequestStatus";
DROP TABLE IF EXISTS "AdventureCreationRequest";

