-- Scope movements to individual users.
-- Existing movements without a userId are orphaned (no owner), so we remove
-- them along with their associated sets before adding the NOT NULL constraint.
-- The seed script will re-create them with proper ownership.

-- Remove sets referencing movements that will be deleted
DELETE FROM "Set" WHERE "movementId" IN (SELECT "id" FROM "Movement");

-- Remove ownerless movements
DELETE FROM "Movement";

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Movement_userId_idx" ON "Movement"("userId");

-- Also add missing ON DELETE CASCADE to existing foreign keys
ALTER TABLE "UserWeight" DROP CONSTRAINT "UserWeight_userId_fkey";
ALTER TABLE "UserWeight" ADD CONSTRAINT "UserWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workout" DROP CONSTRAINT "Workout_userId_fkey";
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NutritionLog" DROP CONSTRAINT "NutritionLog_userId_fkey";
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
