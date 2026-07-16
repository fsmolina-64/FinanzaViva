import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GamificationModule } from '../../gamification/gamification.module';
import { RecurringService } from './recurring.service';
import { RecurringSchedulerService } from './recurring-scheduler.service';
import { RecurringController } from './recurring.controller';

@Module({
  imports: [ScheduleModule.forRoot(), GamificationModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringSchedulerService],
  exports: [RecurringService],
})
export class RecurringModule {}