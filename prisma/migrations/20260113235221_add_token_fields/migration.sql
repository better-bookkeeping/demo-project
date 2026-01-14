-- AlterTable
ALTER TABLE "User" ADD COLUMN "currentToken" TEXT;
ALTER TABLE "User" ADD COLUMN "tokenExpiresAt" DATETIME;
