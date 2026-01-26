-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "servingSize" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_category_idx" ON "Food"("category");
