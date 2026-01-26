/*
  Warnings:

  - Changed the type of `mealType` on the `Nutrition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- AlterTable
ALTER TABLE "Nutrition" DROP COLUMN "mealType",
ADD COLUMN     "mealType" "MealType" NOT NULL;

-- CreateIndex
CREATE INDEX "Food_isCustom_userId_idx" ON "Food"("isCustom", "userId");

-- CreateIndex
CREATE INDEX "Set_workoutId_idx" ON "Set"("workoutId");

-- CreateIndex
CREATE INDEX "Set_movementId_idx" ON "Set"("movementId");

-- CreateIndex
CREATE INDEX "Workout_userId_completedAt_idx" ON "Workout"("userId", "completedAt");
