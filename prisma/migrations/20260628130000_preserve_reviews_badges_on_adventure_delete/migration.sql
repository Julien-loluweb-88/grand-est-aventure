-- Conserver les avis et les badges joueurs lors de la suppression d’une aventure.

ALTER TABLE "AdventureReview" ADD COLUMN IF NOT EXISTS "archivedAdventureName" TEXT;

ALTER TABLE "AdventureReview" DROP CONSTRAINT IF EXISTS "AdventureReview_adventureId_fkey";
ALTER TABLE "AdventureReview" ALTER COLUMN "adventureId" DROP NOT NULL;
ALTER TABLE "AdventureReview" ADD CONSTRAINT "AdventureReview_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BadgeDefinition" DROP CONSTRAINT IF EXISTS "BadgeDefinition_adventureId_fkey";
ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
