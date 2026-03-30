-- CreateTable
CREATE TABLE "UserAdventureStepValidation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adventureId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAdventureStepValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAdventureStepValidation_userId_adventureId_stepKey_key" ON "UserAdventureStepValidation"("userId", "adventureId", "stepKey");

-- CreateIndex
CREATE INDEX "UserAdventureStepValidation_userId_adventureId_idx" ON "UserAdventureStepValidation"("userId", "adventureId");

-- AddForeignKey
ALTER TABLE "UserAdventureStepValidation" ADD CONSTRAINT "UserAdventureStepValidation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAdventureStepValidation" ADD CONSTRAINT "UserAdventureStepValidation_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
