-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_userId_fkey";

-- DropForeignKey
ALTER TABLE "Set" DROP CONSTRAINT "Set_workoutId_fkey";

-- DropForeignKey
ALTER TABLE "WeightEntry" DROP CONSTRAINT "WeightEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "Workout" DROP CONSTRAINT "Workout_userId_fkey";

-- CreateIndex
CREATE INDEX "Set_workoutId_idx" ON "Set"("workoutId");

-- CreateIndex
CREATE INDEX "Set_movementId_idx" ON "Set"("movementId");

-- CreateIndex
CREATE INDEX "Workout_userId_idx" ON "Workout"("userId");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
