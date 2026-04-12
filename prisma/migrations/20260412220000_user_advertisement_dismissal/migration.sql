-- CreateTable
CREATE TABLE "user_advertisement_dismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_advertisement_dismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_advertisement_dismissal_userId_advertisementId_key" ON "user_advertisement_dismissal"("userId", "advertisementId");

-- CreateIndex
CREATE INDEX "user_advertisement_dismissal_userId_idx" ON "user_advertisement_dismissal"("userId");

-- AddForeignKey
ALTER TABLE "user_advertisement_dismissal" ADD CONSTRAINT "user_advertisement_dismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_advertisement_dismissal" ADD CONSTRAINT "user_advertisement_dismissal_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
