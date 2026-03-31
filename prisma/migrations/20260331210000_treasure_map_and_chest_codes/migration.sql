-- Nouveaux champs : code de révélation carte vs code dans le coffre (données migrées depuis code / safeCode).
ALTER TABLE "Treasure" ADD COLUMN "mapRevealCode" TEXT;
ALTER TABLE "Treasure" ADD COLUMN "mapRevealCodeAlt" TEXT;
ALTER TABLE "Treasure" ADD COLUMN "chestCode" TEXT;
ALTER TABLE "Treasure" ADD COLUMN "chestCodeAlt" TEXT;

UPDATE "Treasure"
SET
  "mapRevealCode" = "code",
  "mapRevealCodeAlt" = "safeCode",
  "chestCode" = "code",
  "chestCodeAlt" = "safeCode";

ALTER TABLE "Treasure" ALTER COLUMN "mapRevealCode" SET NOT NULL;
ALTER TABLE "Treasure" ALTER COLUMN "chestCode" SET NOT NULL;

ALTER TABLE "Treasure" DROP COLUMN "code";
ALTER TABLE "Treasure" DROP COLUMN "safeCode";
