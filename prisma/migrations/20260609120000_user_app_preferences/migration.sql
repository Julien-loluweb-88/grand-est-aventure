-- Préférences joueur synchronisées entre appareils (thème, carte, sons, etc.).

ALTER TABLE "user" ADD COLUMN "appPreferences" JSONB;
