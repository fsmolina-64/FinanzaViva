import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/users.module';
import { GamificationModule } from './gamification/gamification.module';
import { FinancesModule } from './finances/finances.module';
import { AcademyModule } from './academy/academy.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SimulatorModule } from './simulator/simulator.module';
import { AchievementsModule } from './achievements/achievements.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamificationModule,
    FinancesModule,
    AcademyModule,
    QuizzesModule,
    SimulatorModule,
    AchievementsModule,
    EventEmitterModule.forRoot(),
  ],
})
export class AppModule {}