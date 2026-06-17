-- DropForeignKey
ALTER TABLE "simulator_games" DROP CONSTRAINT "simulator_games_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_player_rounds" DROP CONSTRAINT "simulator_player_rounds_playerId_fkey";

-- DropForeignKey
ALTER TABLE "simulator_players" DROP CONSTRAINT "simulator_players_userId_fkey";

-- AddForeignKey
ALTER TABLE "simulator_games" ADD CONSTRAINT "simulator_games_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_players" ADD CONSTRAINT "simulator_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_player_rounds" ADD CONSTRAINT "simulator_player_rounds_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "simulator_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
