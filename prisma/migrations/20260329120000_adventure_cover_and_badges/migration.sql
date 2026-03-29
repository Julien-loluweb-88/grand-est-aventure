-- Couverture + un seul visuel de badge (physique + app). Migration tolérante (init avec badgeUrl ou état intermédiaire).

ALTER TABLE "Adventure" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
ALTER TABLE "Adventure" ADD COLUMN IF NOT EXISTS "badgeImageUrl" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Adventure' AND column_name = 'badgeUrl'
  ) THEN
    EXECUTE $u$
      UPDATE "Adventure"
      SET "badgeImageUrl" = "badgeUrl"
      WHERE "badgeUrl" IS NOT NULL AND "badgeUrl" <> 'pas de badge'
    $u$;
    EXECUTE 'ALTER TABLE "Adventure" DROP COLUMN "badgeUrl"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Adventure' AND column_name = 'digitalBadgeUrl'
  ) THEN
    EXECUTE $u$
      UPDATE "Adventure"
      SET "badgeImageUrl" = COALESCE("badgeImageUrl", "digitalBadgeUrl", "physicalBadgeUrl")
      WHERE "digitalBadgeUrl" IS NOT NULL OR "physicalBadgeUrl" IS NOT NULL
    $u$;
    EXECUTE 'ALTER TABLE "Adventure" DROP COLUMN IF EXISTS "digitalBadgeUrl"';
    EXECUTE 'ALTER TABLE "Adventure" DROP COLUMN IF EXISTS "physicalBadgeUrl"';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "UserAdventures_userId_success_idx" ON "UserAdventures" ("userId", "success");
