import { Module } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { AccountsService } from './accounts.service';
import { TransactionsService } from './transactions.service';
import { FinancesController } from './finances.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { RecurringModule } from './recurring/recurring.module';
import { PdfReportDataService } from './pdf/pdf-report-data.service';
import { PdfReportService } from './pdf/pdf-report.service';

@Module({
  imports: [GamificationModule, RecurringModule],
  controllers: [FinancesController],
  providers: [FinancesService, AccountsService, TransactionsService, PdfReportDataService, PdfReportService],
  exports: [FinancesService],
})
export class FinancesModule {}
