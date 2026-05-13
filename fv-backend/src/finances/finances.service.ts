import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { XpSource } from '@prisma/client';

@Injectable()
export class FinancesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}


  async createAccount(userId: string, dto: CreateAccountDto) {
    return this.prisma.financialAccount.create({
      data: { ...dto, userId },
    });
  }

  async getAccounts(userId: string) {
    return this.prisma.financialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.userId !== userId) throw new ForbiddenException();
    return this.prisma.financialAccount.delete({ where: { id: accountId } });
  }


  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || account.userId !== userId) throw new ForbiddenException();

    const balanceDelta =
      dto.type === 'INCOME' ? dto.amount : -dto.amount;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          type: dto.type,
          description: dto.description,
          date: new Date(dto.date),
        },
      }),
      this.prisma.financialAccount.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
      this.prisma.userStatistics.update({
        where: { userId },
        data: { totalTransactions: { increment: 1 } },
      }),
    ]);

    await this.gamification.addXp(userId, {
      amount: 10,
      source: XpSource.TRANSACTION_LOGGED,
      referenceId: transaction.id,
      description: 'Transacción registrada',
    });

    return transaction;
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    });
  }


  async getCategories(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isGlobal: true }, { userId }],
      },
      orderBy: { name: 'asc' },
    });
  }


  async createBudget(userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async getBudgets(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });
  }


  async createGoal(userId: string, dto: CreateGoalDto) {
    return this.prisma.financialGoal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });
  }

  async getGoals(userId: string) {
    return this.prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(userId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { userId },
    });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0,
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
    });

    const income = monthlyTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalBalance, monthlyIncome: income, monthlyExpenses: expenses };
  }
}