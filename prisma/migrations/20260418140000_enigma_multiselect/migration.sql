-- QCM à choix multiples côté joueur ; supprime les « variantes texte » answerAlternatives.
ALTER TABLE "Enigma" DROP COLUMN IF EXISTS "answerAlternatives";
ALTER TABLE "Enigma" ADD COLUMN "multiSelect" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Enigma" ADD COLUMN "correctAnswers" JSONB;
