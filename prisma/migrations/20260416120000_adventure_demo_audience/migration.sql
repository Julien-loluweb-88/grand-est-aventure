-- CreateEnum
CREATE TYPE "AdventureAudience" AS ENUM ('PUBLIC', 'DEMO');

-- AlterTable
ALTER TABLE "Adventure" ADD COLUMN "audience" "AdventureAudience" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "AdventureDemoAccess" (
    "id" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdventureDemoAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdventureDemoAccess_adventureId_userId_key" ON "AdventureDemoAccess"("adventureId", "userId");

-- CreateIndex
CREATE INDEX "AdventureDemoAccess_userId_idx" ON "AdventureDemoAccess"("userId");

-- AddForeignKey
ALTER TABLE "AdventureDemoAccess" ADD CONSTRAINT "AdventureDemoAccess_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdventureDemoAccess" ADD CONSTRAINT "AdventureDemoAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
