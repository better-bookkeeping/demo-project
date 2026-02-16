-- CreateIndex
CREATE INDEX "UserWeight_userId_recordedAt_idx" ON "UserWeight"("userId", "recordedAt" DESC);
