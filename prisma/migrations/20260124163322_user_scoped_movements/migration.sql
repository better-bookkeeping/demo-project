/*
  Warnings:

  - Added the required column `userId` to the `Movement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Movement_userId_idx" ON "Movement"("userId");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
