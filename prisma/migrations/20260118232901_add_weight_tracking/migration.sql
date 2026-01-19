-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('lbs', 'kg');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "weightUnit" "WeightUnit" NOT NULL DEFAULT 'lbs';

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" "WeightUnit" NOT NULL DEFAULT 'lbs',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightEntry_userId_recordedAt_idx" ON "WeightEntry"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
