-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calorieGoal" INTEGER;

-- CreateTable
CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionLog_userId_loggedAt_idx" ON "NutritionLog"("userId", "loggedAt" DESC);

-- CreateIndex
CREATE INDEX "Set_workoutId_idx" ON "Set"("workoutId");

-- CreateIndex
CREATE INDEX "Set_movementId_idx" ON "Set"("movementId");

-- CreateIndex
CREATE INDEX "Workout_userId_completedAt_idx" ON "Workout"("userId", "completedAt");

-- AddForeignKey
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
