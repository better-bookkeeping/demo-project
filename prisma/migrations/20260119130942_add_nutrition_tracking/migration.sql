-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodEntry_userId_loggedAt_idx" ON "FoodEntry"("userId", "loggedAt");

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
