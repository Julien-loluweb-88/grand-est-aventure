-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inseeCode" TEXT,
    "postalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "population" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_inseeCode_key" ON "City"("inseeCode");

-- CreateIndex
CREATE INDEX "City_name_idx" ON "City"("name");

-- Backfill cities from existing adventure city labels
INSERT INTO "City" ("id", "name", "postalCodes", "latitude", "longitude", "population", "inseeCode", "createdAt", "updatedAt")
SELECT
    'city_mig_' || md5(trim(both from a."city")),
    trim(both from a."city"),
    ARRAY[]::TEXT[],
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Adventure" a
WHERE trim(both from a."city") <> ''
GROUP BY trim(both from a."city");

-- Link adventures to migrated cities
ALTER TABLE "Adventure" ADD COLUMN "cityId" TEXT;

UPDATE "Adventure" ad
SET "cityId" = c."id"
FROM "City" c
WHERE c."name" = trim(both from ad."city");

-- Fallback: single placeholder city if any row still missing (should not happen if city was always set)
INSERT INTO "City" ("id", "name", "postalCodes", "latitude", "longitude", "population", "inseeCode", "createdAt", "updatedAt")
SELECT 'city_mig_unknown', 'Non renseigné', ARRAY[]::TEXT[], NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Adventure" WHERE "cityId" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "City" WHERE "id" = 'city_mig_unknown');

UPDATE "Adventure"
SET "cityId" = 'city_mig_unknown'
WHERE "cityId" IS NULL;

ALTER TABLE "Adventure" ALTER COLUMN "cityId" SET NOT NULL;

ALTER TABLE "Adventure" DROP COLUMN "city";

ALTER TABLE "Adventure" ADD CONSTRAINT "Adventure_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Adventure_cityId_idx" ON "Adventure"("cityId");
