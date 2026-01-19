-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- AlterTable FoodEntry: Convert mealType from String to MealType enum
ALTER TABLE "FoodEntry" ALTER COLUMN "mealType" TYPE "MealType" USING "mealType"::"MealType";

-- AlterTable
ALTER TABLE "Set" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
