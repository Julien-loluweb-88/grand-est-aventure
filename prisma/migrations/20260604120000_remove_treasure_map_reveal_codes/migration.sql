-- Drop map reveal codes (treasure:map step removed; only chest code remains)
ALTER TABLE "Treasure" DROP COLUMN "mapRevealCode";
ALTER TABLE "Treasure" DROP COLUMN "mapRevealCodeAlt";
