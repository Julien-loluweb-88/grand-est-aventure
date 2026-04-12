-- Points de découverte (ville ± aventure) + kind DISCOVERY sur BadgeDefinition.

ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'DISCOVERY';

CREATE TABLE "DiscoveryPoint" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "adventureId" TEXT,
    "title" TEXT NOT NULL,
    "teaser" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 50,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscoveryPoint_cityId_idx" ON "DiscoveryPoint"("cityId");
CREATE INDEX "DiscoveryPoint_adventureId_idx" ON "DiscoveryPoint"("adventureId");

ALTER TABLE "DiscoveryPoint" ADD CONSTRAINT "DiscoveryPoint_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscoveryPoint" ADD CONSTRAINT "DiscoveryPoint_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BadgeDefinition" ADD COLUMN "discoveryPointId" TEXT;

CREATE UNIQUE INDEX "BadgeDefinition_discoveryPointId_key" ON "BadgeDefinition"("discoveryPointId");

ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_discoveryPointId_fkey" FOREIGN KEY ("discoveryPointId") REFERENCES "DiscoveryPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
