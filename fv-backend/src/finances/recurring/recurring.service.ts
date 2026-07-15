import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../../gamification/gamification.service';
import { XpSource, RecurringFrequency, RecurringStatus, ExecutionStatus, TransactionType } from '@prisma/client';
import { CreateRecurringRuleDto, UpdateRecurringRuleDto } from './dto/create-recurring-rule.dto';

function addInterval(date: Date, frequency: RecurringFrequency, interval: number = 1): Date {
  const result = new Date(date);
  switch (frequency) {
    case 'DAILY':
      result.setDate(result.getDate() + interval);
      break;
    case 'WEEKLY':
      result.setDate(result.getDate() + 7 * interval);
      break;
    case 'BIWEEKLY':
      result.setDate(result.getDate() + 14 * interval);
      break;
    case 'MONTHLY':
      result.setMonth(result.getMonth() + interval);
      // Handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
      if (result.getDate() !== date.getDate()) {
        result.setDate(0); // Last day of previous month
      }
      break;
    case 'QUARTERLY':
      result.setMonth(result.getMonth() + 3 * interval);
      break;
    case 'YEARLY':
      result.setFullYear(result.getFullYear() + interval);
      break;
  }
  return result;
}

@Injectable()
export class RecurringService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async create(userId: string, dto: CreateRecurringRuleDto) {
    // Verify account belongs to user
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || account.userId !== userId) throw new ForbiddenException('Cuenta no encontrada');

    // Verify category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new BadRequestException('Categoría no encontrada');
      }
    }

    const startDate = new Date(dto.startDate);
    const nextRunDate = new Date(startDate);
    nextRunDate.setHours(3, 0, 0, 0); // Run at 3 AM

    return this.prisma.recurringRule.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        frequency: dto.frequency,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextRunDate,
        maxOccurrences: dto.maxOccurrences,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.recurringRule.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, ruleId: string) {
    const rule = await this.prisma.recurringRule.findFirst({
      where: { id: ruleId, userId },
      include: {
        account: true,
        category: true,
        executions: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });
    if (!rule) throw new NotFoundException('Regla recurrente no encontrada');
    return rule;
  }

  async update(userId: string, ruleId: string, dto: UpdateRecurringRuleDto) {
    const rule = await this.findOne(userId, ruleId);

    // Verify account if changing
    if (dto.accountId) {
      const account = await this.prisma.financialAccount.findUnique({
        where: { id: dto.accountId },
      });
      if (!account || account.userId !== userId) throw new ForbiddenException('Cuenta no encontrada');
    }

    // Verify category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new BadRequestException('Categoría no encontrada');
      }
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    // Recalculate nextRunDate if frequency or interval changed
    if (dto.frequency || dto.interval || dto.startDate) {
      const freq = dto.frequency || rule.frequency;
      const interval = dto.interval || 1;
      const start = dto.startDate ? new Date(dto.startDate) : rule.startDate;
      updateData.nextRunDate = addInterval(start, freq, interval);
      updateData.nextRunDate.setHours(3, 0, 0, 0);
    }

    return this.prisma.recurringRule.update({
      where: { id: ruleId },
      data: updateData,
    });
  }

  async delete(userId: string, ruleId: string) {
    await this.findOne(userId, ruleId);
    return this.prisma.recurringRule.delete({ where: { id: ruleId } });
  }

  async executeNow(userId: string, ruleId: string) {
    const rule = await this.findOne(userId, ruleId);
    if (rule.status !== 'ACTIVE') throw new BadRequestException('La regla no está activa');
    return this.processRule(rule);
  }

  async processDueRules() {
    const now = new Date();
    const rules = await this.prisma.recurringRule.findMany({
      where: {
        status: 'ACTIVE',
        nextRunDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    });

    const results = [];
    for (const rule of rules) {
      const result = await this.processRule(rule);
      results.push(result);
    }
    return results;
  }

  private async processRule(rule: any) {
    const now = new Date();

    // Check if rule should be completed
    if (rule.maxOccurrences && rule.occurrenceCount >= rule.maxOccurrences) {
      await this.prisma.recurringRule.update({
        where: { id: rule.id },
        data: { status: 'COMPLETED' },
      });
      return { ruleId: rule.id, status: 'COMPLETED', message: 'Max occurrences reached' };
    }

    // Check if past end date
    if (rule.endDate && new Date(rule.endDate) < now) {
      await this.prisma.recurringRule.update({
        where: { id: rule.id },
        data: { status: 'COMPLETED' },
      });
      return { ruleId: rule.id, status: 'COMPLETED', message: 'End date passed' };
    }

    try {
      // Check account balance for expenses
      const account = await this.prisma.financialAccount.findUnique({
        where: { id: rule.accountId },
      });
      if (!account) throw new Error('Cuenta no encontrada');

      const amount = Number(rule.amount);
      if (rule.type === 'EXPENSE' && Number(account.balance) < amount) {
        // Record failed execution
        await this.recordExecution(rule.id, null, amount, 'FAILED', 'Saldo insuficiente');
        return { ruleId: rule.id, status: 'FAILED', message: 'Insufficient balance' };
      }

      // Create transaction in atomic operation
      const [transaction] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            userId: rule.userId,
            accountId: rule.accountId,
            categoryId: rule.categoryId,
            amount: rule.amount,
            type: rule.type,
            description: rule.description || `Recurrente: ${rule.description || 'Transacción'}`,
            date: now,
          },
        }),
        this.prisma.financialAccount.update({
          where: { id: rule.accountId },
          data: { balance: { increment: rule.type === 'INCOME' ? amount : -amount } },
        }),
        this.prisma.userStatistics.update({
          where: { userId: rule.userId },
          data: { totalTransactions: { increment: 1 } },
        }),
      ]);

      // Award XP
      await this.gamification.addXp(rule.userId, {
        amount: 10,
        source: XpSource.TRANSACTION_LOGGED,
        referenceId: transaction.id,
        description: 'Transacción recurrente',
      });

      // Record successful execution
      await this.recordExecution(rule.id, transaction.id, amount, 'SUCCESS');

      // Update rule for next run
      const nextRunDate = addInterval(rule.nextRunDate, rule.frequency, 1);
      nextRunDate.setHours(3, 0, 0, 0);

      const newOccurrenceCount = rule.occurrenceCount + 1;
      const updateData: any = {
        lastRunDate: now,
        nextRunDate,
        occurrenceCount: newOccurrenceCount,
      };

      // Check if completed
      if (rule.maxOccurrences && newOccurrenceCount >= rule.maxOccurrences) {
        updateData.status = 'COMPLETED';
      }

      await this.prisma.recurringRule.update({
        where: { id: rule.id },
        data: updateData,
      });

      return { ruleId: rule.id, status: 'SUCCESS', transactionId: transaction.id };
    } catch (error: unknown) {
      // Record failed execution
      const message = error instanceof Error ? error.message : 'Error desconocido';
      await this.recordExecution(rule.id, null, Number(rule.amount), 'FAILED', message);
      return { ruleId: rule.id, status: 'FAILED', message };
    }
  }

  private async recordExecution(
    ruleId: string,
    transactionId: string | null,
    amount: number,
    status: ExecutionStatus,
    errorMessage?: string,
  ) {
    return this.prisma.recurringExecution.create({
      data: {
        ruleId,
        transactionId,
        amount,
        status,
        errorMessage,
      },
    });
  }

  async getExecutions(userId: string, ruleId: string) {
    const rule = await this.prisma.recurringRule.findUnique({ where: { id: ruleId } });
    if (!rule || rule.userId !== userId) throw new NotFoundException('Regla recurrente no encontrada');

    return this.prisma.recurringExecution.findMany({
      where: { ruleId },
      orderBy: { executedAt: 'desc' },
    });
  }
}