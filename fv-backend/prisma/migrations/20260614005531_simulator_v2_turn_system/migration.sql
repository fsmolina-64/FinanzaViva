-- CreateEnum
CREATE TYPE "BotPersonality" AS ENUM ('CONSERVATIVE', 'RISKY', 'IMPULSIVE', 'INVESTOR', 'SAVER');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('MULTIPLAYER', 'SOLO', 'SIMULATION', 'MIXED');

-- AlterTable
ALTER TABLE "simulator_event_options" ADD COLUMN     "consequenceDesc" TEXT,
ADD COLUMN     "consequenceRounds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "effectAssets" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "effectExpenses" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "effectInvestments" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "effectSavings" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "effectIncome" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "simulator_games" ADD COLUMN     "currentPlayerId" TEXT,
ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'MULTIPLAYER',
ADD COLUMN     "xpRecipientId" TEXT;

-- AlterTable
ALTER TABLE "simulator_players" ADD COLUMN     "assets" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "botPersonality" "BotPersonality",
ADD COLUMN     "currentEventId" TEXT,
ADD COLUMN     "hasActed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "investments" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savings" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "turnOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "simulator_consequences" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectMoney" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effectIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effectExpenses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effectScore" INTEGER NOT NULL DEFAULT 0,
    "roundsRemaining" INTEGER NOT NULL,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulator_consequences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "simulator_consequences" ADD CONSTRAINT "simulator_consequences_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "simulator_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
