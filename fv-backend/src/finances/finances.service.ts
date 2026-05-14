import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  // ── CUENTAS ──────────────────────────────────────

  async createAccount(userId: string, dto: CreateAccountDto) {
    return this.prisma.financialAccount.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        isDefault: dto.isDefault ?? false,
        balance: dto.initialBalance ?? 0,
      },
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

  // ── TRANSACCIONES ─────────────────────────────────

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || account.userId !== userId) throw new ForbiddenException();

    // Validar saldo suficiente antes de gastar
    if (dto.type === 'EXPENSE') {
      if (Number(account.balance) < dto.amount) {
        throw new BadRequestException(
          `Saldo insuficiente. Tienes $${Number(account.balance).toFixed(2)} y quieres gastar $${dto.amount.toFixed(2)}`,
        );
      }
    }

    const balanceDelta = dto.type === 'INCOME' ? dto.amount : -dto.amount;

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

    // Verificar alerta de presupuesto por categoría
    let alert: { type: string; message: string; percentage: number } | null = null;

    if (dto.type === 'EXPENSE') {
      const budget = await this.prisma.budget.findFirst({
        where: {
          userId,
          categoryId: dto.categoryId,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });

      if (budget) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const spent = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: dto.categoryId,
            type: 'EXPENSE',
            date: { gte: startOfMonth },
          },
          _sum: { amount: true },
        });

        const totalSpent = Number(spent._sum.amount ?? 0);
        const budgetAmount = Number(budget.amount);
        const percentage = Math.round((totalSpent / budgetAmount) * 100);

        if (totalSpent > budgetAmount) {
          alert = {
            type: 'BUDGET_EXCEEDED',
            message: `Superaste tu presupuesto en esta categoría. Gastaste $${totalSpent.toFixed(2)} de $${budgetAmount.toFixed(2)}`,
            percentage,
          };
        } else if (percentage >= 80) {
          alert = {
            type: 'BUDGET_WARNING',
            message: `Llevas el ${percentage}% de tu presupuesto en esta categoría.`,
            percentage,
          };
        }
      }
    }

    return { transaction, alert };
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();

    const balanceDelta =
      transaction.type === 'INCOME'
        ? -Number(transaction.amount)
        : Number(transaction.amount);

    await this.prisma.$transaction([
      this.prisma.transaction.delete({ where: { id: transactionId } }),
      this.prisma.financialAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
      this.prisma.userStatistics.update({
        where: { userId },
        data: { totalTransactions: { decrement: 1 } },
      }),
    ]);

    return { message: 'Transacción eliminada' };
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

  async getBudgetHealth(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      include: { category: true },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const available = income - expenses;
    const percentage = income > 0 ? Math.round((expenses / income) * 100) : 0;

    let status: string;
    let message: string;

    if (percentage >= 100) {
      status = 'CRITICAL';
      message = `Gastaste más de lo que ganaste. Déficit de $${Math.abs(available).toFixed(2)}`;
    } else if (percentage >= 90) {
      status = 'DANGER';
      message = `Cuidado. Usaste el ${percentage}% de tus ingresos. Solo te quedan $${available.toFixed(2)}`;
    } else if (percentage >= 80) {
      status = 'WARNING';
      message = `Vas al ${percentage}% de tu presupuesto. Modera tus gastos.`;
    } else {
      status = 'HEALTHY';
      message = `Vas bien. Llevas el ${percentage}% de tu presupuesto usado.`;
    }

    // Gastos agrupados por categoría
    const breakdown = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc: Record<string, number>, t) => {
        const cat = t.category.name;
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {});

    return {
      income,
      expenses,
      available,
      percentage,
      status,
      message,
      breakdown,
    };
  }
}