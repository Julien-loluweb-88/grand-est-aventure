-- Alertes joueur : trésor temporairement indisponible (admin)
ALTER TABLE "Adventure" ADD COLUMN "treasureUnavailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Adventure" ADD COLUMN "treasureUnavailableMessage" TEXT;
ALTER TABLE "Adventure" ADD COLUMN "treasureUnavailableUpdatedAt" TIMESTAMP(3);
