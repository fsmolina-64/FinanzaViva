import { Module } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { AccountsService } from './accounts.service';
import { TransactionsService } from './transactions.service';
import { FinancesController } from './finances.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [FinancesController],
  providers: [FinancesService, AccountsService, TransactionsService],
  exports: [FinancesService],
})
export class FinancesModule {}
