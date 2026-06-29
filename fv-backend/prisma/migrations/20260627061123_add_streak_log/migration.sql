-- This migration was already applied to the database
-- Added for drift resolution

-- Create StreakStatus enum
CREATE TYPE "StreakStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'LOST');

-- Create streak_logs table
CREATE TABLE "streak_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "StreakStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "streak_logs_userId_date_key" UNIQUE ("userId", "date")
);

-- Create index on userId
CREATE INDEX "streak_logs_userId_idx" ON "streak_logs"("userId");

-- Add foreign key
ALTER TABLE "streak_logs" ADD CONSTRAINT "streak_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
