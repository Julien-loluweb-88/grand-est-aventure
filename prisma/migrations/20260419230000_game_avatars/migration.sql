-- Catalogue avatars (métadonnées) + préférence joueur. Les modèles 3D restent dans l’app mobile (slug).

CREATE TABLE "avatar" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "avatar_slug_key" ON "avatar"("slug");

INSERT INTO "avatar" ("id", "slug", "name", "thumbnailUrl", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
    ('cmgameavatar01fox1', 'companion_fox', 'Renard', NULL, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cmgameavatar02owl1', 'companion_owl', 'Hibou', NULL, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cmgameavatar03bdg1', 'companion_badger', 'Blaireau', NULL, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "user" ADD COLUMN "selectedAvatarId" TEXT;

CREATE INDEX "user_selectedAvatarId_idx" ON "user"("selectedAvatarId");

ALTER TABLE "user" ADD CONSTRAINT "user_selectedAvatarId_fkey" FOREIGN KEY ("selectedAvatarId") REFERENCES "avatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
