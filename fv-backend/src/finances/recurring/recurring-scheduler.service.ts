import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringService } from './recurring.service';

@Injectable()
export class RecurringSchedulerService {
  private readonly logger = new Logger(RecurringSchedulerService.name);

  constructor(private recurringService: RecurringService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'America/Guayaquil' })
  async handleDailyRecurring() {
    this.logger.log('Ejecutando procesador de transacciones recurrentes...');
    try {
      const results = await this.recurringService.processDueRules();
      const success = results.filter(r => r.status === 'SUCCESS').length;
      const failed = results.filter(r => r.status === 'FAILED').length;
      const completed = results.filter(r => r.status === 'COMPLETED').length;
      this.logger.log(`Procesamiento completado: ${success} exitosas, ${failed} fallidas, ${completed} completadas`);
    } catch (error: unknown) {
      this.logger.error('Error procesando reglas recurrentes', error instanceof Error ? error.stack : String(error));
    }
  }

  @Cron(CronExpression.EVERY_HOUR, { timeZone: 'America/Guayaquil' })
  async handleHourlyRecurring() {
    try {
      const results = await this.recurringService.processDueRules();
      if (results.length > 0) {
        this.logger.log(`Procesamiento horario: ${results.length} reglas procesadas`);
      }
    } catch (error: unknown) {
      this.logger.error('Error en procesamiento horario de recurrentes', error instanceof Error ? error.stack : String(error));
    }
  }
}