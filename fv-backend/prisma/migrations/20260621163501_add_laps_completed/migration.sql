/*
  Warnings:

  - You are about to drop the column `currentPlayerId` on the `simulator_games` table. All the data in the column will be lost.
  - You are about to drop the column `roundType` on the `simulator_games` table. All the data in the column will be lost.
  - You are about to drop the column `assets` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `currentEventId` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `debt` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `expenses` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `finalRank` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `financialScore` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `hasActed` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `investments` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `savings` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `simulator_players` table. All the data in the column will be lost.
  - You are about to alter the column `money` on the `simulator_players` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - You are about to drop the `simulator_consequences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulator_event_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulator_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulator_player_rounds` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simulator_rounds` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CellType" AS ENUM ('INICIO', 'PROPERTY', 'TAX', 'LOTTERY', 'WILDCARD', 'SCAM', 'PENSION', 'PENSION_ESPECIAL', 'JAIL', 'GO_TO_JAIL');

-- CreateEnum
CREATE TYPE "WildcardType" AS ENUM ('POSITIVE', 'NEGATIVE', 'GO_TO_JAIL', 'COLLECT_FROM_ALL', 'PAY_TO_ALL');

-- CreateEnum
CREATE TYPE "GamePhase" AS ENUM ('WAITING', 'ROLLING', 'MOVING', 'ACTION', 'BUYING', 'WILDCARD_REVEAL', 'BETWEEN_TURNS', 'FINISHED', 'ABANDONED');

-- AlterEnum
ALTER TYPE "SimulatorStatus" ADD VALUE 'ABANDONED';

-- AlterEnum
ALTER TYPE "XpSource" ADD VALUE 'SIMULATOR_GAME_FINISHED';

-- DropForeignKey
ALTER TABLE "simulator_consequences" DROP CONSTRAINT "simulator_consequences_playerId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_event_options" DROP CONSTRAINT "simulator_event_options_eventId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_player_rounds" DROP CONSTRAINT "simulator_player_rounds_chosenOptionId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_player_rounds" DROP CONSTRAINT "simulator_player_rounds_eventId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_player_rounds" DROP CONSTRAINT "simulator_player_rounds_playerId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_player_rounds" DROP CONSTRAINT "simulator_player_rounds_roundId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_rounds" DROP CONSTRAINT "simulator_rounds_gameId_fkey";

-- AlterTable
ALTER TABLE "simulator_games" DROP COLUMN "currentPlayerId",
DROP COLUMN "roundType",
ADD COLUMN     "abandonedAt" TIMESTAMP(3),
ADD COLUMN     "currentDice1" INTEGER,
ADD COLUMN     "currentDice2" INTEGER,
ADD COLUMN     "currentPlayerIdx" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gamePhase" "GamePhase" NOT NULL DEFAULT 'WAITING',
ADD COLUMN     "initialMoney" INTEGER NOT NULL DEFAULT 1500,
ALTER COLUMN "maxRounds" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "simulator_players" DROP COLUMN "assets",
DROP COLUMN "currentEventId",
DROP COLUMN "debt",
DROP COLUMN "expenses",
DROP COLUMN "finalRank",
DROP COLUMN "financialScore",
DROP COLUMN "hasActed",
DROP COLUMN "income",
DROP COLUMN "investments",
DROP COLUMN "savings",
DROP COLUMN "xpEarned",
ADD COLUMN     "hasRolled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInJail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jailTurnsLeft" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lapsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "money" SET DEFAULT 1500,
ALTER COLUMN "money" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "simulator_consequences";

-- DropTable
DROP TABLE "simulator_event_options";

-- DropTable
DROP TABLE "simulator_events";

-- DropTable
DROP TABLE "simulator_player_rounds";

-- DropTable
DROP TABLE "simulator_rounds";

-- DropEnum
DROP TYPE "EventCategory";

-- DropEnum
DROP TYPE "RoundType";

-- CreateTable
CREATE TABLE "player_properties" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cellPosition" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_cells" (
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CellType" NOT NULL,
    "group" TEXT,
    "price" INTEGER,
    "rent" INTEGER,
    "amount" INTEGER,
    "description" TEXT NOT NULL,

    CONSTRAINT "board_cells_pkey" PRIMARY KEY ("position")
);

-- CreateTable
CREATE TABLE "board_wildcards" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "WildcardType" NOT NULL,
    "effectAmount" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "board_wildcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_properties_gameId_cellPosition_key" ON "player_properties"("gameId", "cellPosition");

-- AddForeignKey
ALTER TABLE "player_properties" ADD CONSTRAINT "player_properties_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "simulator_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
