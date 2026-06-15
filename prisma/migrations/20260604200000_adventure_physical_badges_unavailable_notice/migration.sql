ALTER TABLE "Adventure" ADD COLUMN "physicalBadgesUnavailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Adventure" ADD COLUMN "physicalBadgesUnavailableMessage" TEXT;
ALTER TABLE "Adventure" ADD COLUMN "physicalBadgesUnavailableUpdatedAt" TIMESTAMP(3);
