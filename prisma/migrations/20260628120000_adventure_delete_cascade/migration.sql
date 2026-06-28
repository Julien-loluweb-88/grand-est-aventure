-- Permettre la suppression d'une aventure avec énigmes, trésor, parties joueurs et gains roue partenaire.

ALTER TABLE "Enigma" DROP CONSTRAINT "Enigma_adventureId_fkey";
ALTER TABLE "Enigma" ADD CONSTRAINT "Enigma_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Treasure" DROP CONSTRAINT "Treasure_adventureId_fkey";
ALTER TABLE "Treasure" ADD CONSTRAINT "Treasure_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAdventures" DROP CONSTRAINT "UserAdventures_adventureId_fkey";
ALTER TABLE "UserAdventures" ADD CONSTRAINT "UserAdventures_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAdventurePartnerLotWin" DROP CONSTRAINT "UserAdventurePartnerLotWin_adventurePartnerLotId_fkey";
ALTER TABLE "UserAdventurePartnerLotWin" ADD CONSTRAINT "UserAdventurePartnerLotWin_adventurePartnerLotId_fkey" FOREIGN KEY ("adventurePartnerLotId") REFERENCES "AdventurePartnerLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
