/*
  Warnings:

  - A unique constraint covering the columns `[userId,source,referenceId]` on the table `xp_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "xp_transactions_userId_source_referenceId_key" ON "xp_transactions"("userId", "source", "referenceId");
