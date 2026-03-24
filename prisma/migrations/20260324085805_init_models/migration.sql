-- AlterTable
ALTER TABLE "user" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- CreateTable
CREATE TABLE "Adventure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "badgeUrl" TEXT NOT NULL DEFAULT 'pas de badge',
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Adventure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enigma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "uniqueResponse" BOOLEAN NOT NULL DEFAULT false,
    "choice" JSONB,
    "answer" TEXT NOT NULL,
    "answerMessage" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adventureId" TEXT NOT NULL,

    CONSTRAINT "Enigma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treasure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "code" TEXT NOT NULL,
    "safeCode" TEXT DEFAULT 'AAA',
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adventureId" TEXT NOT NULL,

    CONSTRAINT "Treasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAdventures" (
    "id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "giftNumber" INTEGER NOT NULL DEFAULT 0,
    "adventureId" TEXT NOT NULL,

    CONSTRAINT "UserAdventures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNotice" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "adventureName" TEXT NOT NULL,
    "image" TEXT,
    "overdraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Treasure_adventureId_key" ON "Treasure"("adventureId");

-- AddForeignKey
ALTER TABLE "Adventure" ADD CONSTRAINT "Adventure_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enigma" ADD CONSTRAINT "Enigma_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treasure" ADD CONSTRAINT "Treasure_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdventures" ADD CONSTRAINT "UserAdventures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdventures" ADD CONSTRAINT "UserAdventures_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNotice" ADD CONSTRAINT "ClientNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
