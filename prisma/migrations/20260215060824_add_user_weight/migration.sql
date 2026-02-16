-- CreateTable
CREATE TABLE "UserWeight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWeight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserWeight" ADD CONSTRAINT "UserWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
