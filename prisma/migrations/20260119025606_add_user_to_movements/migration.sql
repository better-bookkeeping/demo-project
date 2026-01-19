-- Delete existing sets and movements (dev database only)
DELETE FROM "Set";
DELETE FROM "Movement";

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Movement_userId_idx" ON "Movement"("userId");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
