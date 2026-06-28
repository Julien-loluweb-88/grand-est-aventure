-- Conserver les points de découverte en POI ville lors de la suppression d’une aventure.

ALTER TABLE "DiscoveryPoint" DROP CONSTRAINT IF EXISTS "DiscoveryPoint_adventureId_fkey";
ALTER TABLE "DiscoveryPoint" ADD CONSTRAINT "DiscoveryPoint_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
