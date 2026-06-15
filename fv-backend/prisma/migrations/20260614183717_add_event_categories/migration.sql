-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventCategory" ADD VALUE 'MARKET';
ALTER TYPE "EventCategory" ADD VALUE 'EDUCATION';
ALTER TYPE "EventCategory" ADD VALUE 'CREDIT';
ALTER TYPE "EventCategory" ADD VALUE 'MORTGAGE';
ALTER TYPE "EventCategory" ADD VALUE 'INSURANCE';
ALTER TYPE "EventCategory" ADD VALUE 'SAVINGS';
