-- Badges globaux : kinds performance / spéciaux + contexte UserBadge.

ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'SPECIAL_TIME_WINDOW';
ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'PERFORMANCE_STREAK';
ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'PERFORMANCE_FASTEST';
ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'PERFORMANCE_MONTHLY_KM';
ALTER TYPE "BadgeDefinitionKind" ADD VALUE 'PERFORMANCE_COLLECT';

ALTER TABLE "UserBadge" ADD COLUMN IF NOT EXISTS "context" JSONB;
