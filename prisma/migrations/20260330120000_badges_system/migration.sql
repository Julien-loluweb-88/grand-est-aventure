-- Système de badges : catalogue, collection joueur, stock physique optionnel.
-- Migre `Adventure.badgeImageUrl` vers `BadgeDefinition` puis supprime la colonne.

CREATE TYPE "BadgeDefinitionKind" AS ENUM ('ADVENTURE_COMPLETE', 'MILESTONE_ADVENTURES', 'MILESTONE_KM');
CREATE TYPE "AdventureBadgeInstanceStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'MISSING', 'STOLEN');

CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "kind" "BadgeDefinitionKind" NOT NULL,
    "adventureId" TEXT,
    "criteria" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BadgeDefinition_slug_key" ON "BadgeDefinition"("slug");
CREATE UNIQUE INDEX "BadgeDefinition_adventureId_key" ON "BadgeDefinition"("adventureId");
CREATE INDEX "BadgeDefinition_kind_idx" ON "BadgeDefinition"("kind");

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeDefinitionId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserBadge_userId_badgeDefinitionId_key" ON "UserBadge"("userId", "badgeDefinitionId");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX "UserBadge_badgeDefinitionId_idx" ON "UserBadge"("badgeDefinitionId");

CREATE TABLE "AdventureBadgeInstance" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "giftNumber" INTEGER NOT NULL,
    "status" "AdventureBadgeInstanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "claimedByUserId" TEXT,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "AdventureBadgeInstance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdventureBadgeInstance_adventureId_giftNumber_key" ON "AdventureBadgeInstance"("adventureId", "giftNumber");
CREATE INDEX "AdventureBadgeInstance_adventureId_status_idx" ON "AdventureBadgeInstance"("adventureId", "status");
CREATE INDEX "AdventureBadgeInstance_claimedByUserId_idx" ON "AdventureBadgeInstance"("claimedByUserId");

-- Colonne stock avant migration des données image
ALTER TABLE "Adventure" ADD COLUMN IF NOT EXISTS "physicalBadgeStockCount" INTEGER NOT NULL DEFAULT 0;

-- Données : un BadgeDefinition par aventure (image + titre)
INSERT INTO "BadgeDefinition" ("id", "slug", "title", "imageUrl", "kind", "adventureId", "criteria", "sortOrder", "createdAt", "updatedAt")
SELECT
    'bd_adv_' || a."id",
    'adventure-' || a."id",
    a."name",
    NULLIF(TRIM(a."badgeImageUrl"), ''),
    'ADVENTURE_COMPLETE'::"BadgeDefinitionKind",
    a."id",
    NULL,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Adventure" a;

ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdventureBadgeInstance" ADD CONSTRAINT "AdventureBadgeInstance_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdventureBadgeInstance" ADD CONSTRAINT "AdventureBadgeInstance_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Collection : parties déjà réussies → `UserBadge` (badge virtuel d’aventure)
INSERT INTO "UserBadge" ("id", "userId", "badgeDefinitionId", "earnedAt")
SELECT
  'ub_' || ua."id",
  ua."userId",
  'bd_adv_' || ua."adventureId",
  COALESCE(ua."updatedAt", ua."createdAt")
FROM "UserAdventures" ua
WHERE ua."success" = true
ON CONFLICT ("userId", "badgeDefinitionId") DO NOTHING;

-- Badges paliers globaux (critères évalués côté appli)
INSERT INTO "BadgeDefinition" ("id", "slug", "title", "imageUrl", "kind", "adventureId", "criteria", "sortOrder", "createdAt", "updatedAt")
VALUES
    ('bd_milestone_10_adv', 'milestone-10-adventures', '10 aventures complétées', NULL, 'MILESTONE_ADVENTURES'::"BadgeDefinitionKind", NULL, '{"minCompletedAdventures":10}'::jsonb, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bd_milestone_50_km', 'milestone-50-km', '50 km parcourus', NULL, 'MILESTONE_KM'::"BadgeDefinitionKind", NULL, '{"minKmTotal":50}'::jsonb, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Adventure" DROP COLUMN IF EXISTS "badgeImageUrl";
