-- CreateEnum
CREATE TYPE "StreakStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'LOST');

-- CreateTable
CREATE TABLE "streak_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "streak" INTEGER NOT NULL,
    "status" "StreakStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streak_logs_userId_idx" ON "streak_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "streak_logs_userId_date_key" ON "streak_logs"("userId", "date");

-- AddForeignKey
ALTER TABLE "streak_logs" ADD CONSTRAINT "streak_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
