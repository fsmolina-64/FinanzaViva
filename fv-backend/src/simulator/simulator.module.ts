import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { GameStateService } from './game-state.service';
import { BotService } from './bot.service';
import { SimulatorController } from './simulator.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [GamificationModule, PrismaModule],
  controllers: [SimulatorController],
  providers: [SimulatorService, GameStateService, BotService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
