import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { XpSource } from '@prisma/client';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class FinancesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) { }


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
      include: { _count: { select: { transactions: true } } },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.userId !== userId) throw new ForbiddenException();
    if (account._count.transactions > 0) {
      throw new BadRequestException(
        `No puedes eliminar esta cuenta porque tiene ${account._count.transactions} transacciones registradas. Elimina las transacciones primero o transfiere el saldo a otra cuenta.`
      );
    }
    return this.prisma.financialAccount.delete({ where: { id: accountId } });
  }



  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || account.userId !== userId) throw new ForbiddenException();

    if (dto.type === 'EXPENSE' && !dto.allowNegative) {
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
      message = '¡Ojo! Estás a punto de gastar todo el dinero que ingresó este mes.';
    } else if (percentage >= 80) {
      status = 'WARNING';
      message = 'Tus gastos ya representan una parte importante de los ingresos de este mes. Gasta con precaución.';
    } else {
      status = 'HEALTHY';
      message = 'Vas bien. Tus gastos están bajo control en relación con los ingresos de este mes.';
    }

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

  async updateBudget(userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.userId !== userId) throw new ForbiddenException();

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.period !== undefined && { period: dto.period }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async deleteBudget(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.userId !== userId) throw new ForbiddenException();
    return this.prisma.budget.delete({ where: { id: budgetId } });
  }


  async updateGoal(userId: string, goalId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.financialGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.userId !== userId) throw new ForbiddenException();

    const newCurrent = dto.currentAmount !== undefined ? dto.currentAmount : Number(goal.currentAmount);
    const newTarget = dto.targetAmount !== undefined ? dto.targetAmount : Number(goal.targetAmount);
    let resolvedStatus = dto.status;
    if (newCurrent >= newTarget) resolvedStatus = 'COMPLETED';
    else if (!resolvedStatus) resolvedStatus = 'ACTIVE';

    // Si se envía fromAccountId, descontar de la cuenta
    if (dto.fromAccountId && dto.currentAmount !== undefined) {
      const account = await this.prisma.financialAccount.findUnique({ where: { id: dto.fromAccountId } });
      if (!account || account.userId !== userId)
        throw new ForbiddenException('Cuenta no encontrada');

      const addedAmount = dto.currentAmount - Number(goal.currentAmount);
      if (addedAmount > 0) {
        if (Number(account.balance) < addedAmount) {
          throw new BadRequestException(
            `Saldo insuficiente en ${account.name}. Disponible: $${Number(account.balance).toFixed(2)}, necesitas: $${addedAmount.toFixed(2)}`
          );
        }
        const [updatedGoal] = await this.prisma.$transaction([
          this.prisma.financialGoal.update({
            where: { id: goalId },
            data: {
              ...(dto.name !== undefined && { name: dto.name }),
              ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
              currentAmount: dto.currentAmount,
              ...(dto.deadline !== undefined && { deadline: new Date(dto.deadline) }),
              status: resolvedStatus,
            },
          }),
          this.prisma.financialAccount.update({
            where: { id: dto.fromAccountId },
            data: { balance: { decrement: addedAmount } },
          }),
        ]);
        return updatedGoal;
      }
    }

    return this.prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
        ...(dto.currentAmount !== undefined && { currentAmount: dto.currentAmount }),
        ...(dto.deadline !== undefined && { deadline: new Date(dto.deadline) }),
        status: resolvedStatus,
      },
    });
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.prisma.financialGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.userId !== userId) throw new ForbiddenException();
    return this.prisma.financialGoal.delete({ where: { id: goalId } });
  }


  async updateTransaction(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('Transaccion no encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();

    const account = await this.prisma.financialAccount.findUnique({
      where: { id: transaction.accountId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const originalDelta = transaction.type === 'INCOME'
      ? -Number(transaction.amount)
      : Number(transaction.amount);

    const newType = dto.type ?? transaction.type;
    const newAmount = dto.amount ?? Number(transaction.amount);

    const balanceAfterReverse = Number(account.balance) + originalDelta;
    if (newType === 'EXPENSE' && balanceAfterReverse < newAmount) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponible: $${balanceAfterReverse.toFixed(2)}`
      );
    }

    const newDelta = newType === 'INCOME' ? newAmount : -newAmount;

    const [updated] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.date !== undefined && { date: new Date(dto.date) }),
        },
      }),
      this.prisma.financialAccount.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: originalDelta + newDelta } },
      }),
    ]);

    return updated;
  }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('No puedes transferir a la misma cuenta');
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.financialAccount.findUnique({ where: { id: dto.fromAccountId } }),
      this.prisma.financialAccount.findUnique({ where: { id: dto.toAccountId } }),
    ]);

    if (!fromAccount || fromAccount.userId !== userId)
      throw new ForbiddenException('Cuenta origen no encontrada');
    if (!toAccount || toAccount.userId !== userId)
      throw new ForbiddenException('Cuenta destino no encontrada');
    if (Number(fromAccount.balance) < dto.amount)
      throw new BadRequestException(
        `Saldo insuficiente en cuenta origen. Disponible: $${Number(fromAccount.balance).toFixed(2)}`,
      );

    let transferCategory = await this.prisma.category.findFirst({
      where: { isGlobal: true, name: { contains: 'Transferencia', mode: 'insensitive' } },
    });
    if (!transferCategory) {
      transferCategory = await this.prisma.category.findFirst({ where: { isGlobal: true } });
    }
    if (!transferCategory) throw new BadRequestException('No hay categorias disponibles');

    const transferDate = new Date(dto.date);
    const description = dto.description?.trim() || `Transferencia a ${toAccount.name}`;

    const [fromTx, toTx] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.fromAccountId,
          categoryId: transferCategory.id,
          amount: dto.amount,
          type: 'TRANSFER',
          description: `Transferencia a ${toAccount.name}${dto.description ? ': ' + dto.description : ''}`,
          date: transferDate,
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.toAccountId,
          categoryId: transferCategory.id,
          amount: dto.amount,
          type: 'TRANSFER',
          description: `Transferencia desde ${fromAccount.name}${dto.description ? ': ' + dto.description : ''}`,
          date: transferDate,
        },
      }),
      this.prisma.financialAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: { decrement: dto.amount } },
      }),
      this.prisma.financialAccount.update({
        where: { id: dto.toAccountId },
        data: { balance: { increment: dto.amount } },
      }),
      this.prisma.userStatistics.update({
        where: { userId },
        data: { totalTransactions: { increment: 2 } },
      }),
    ]);

    await this.gamification.addXp(userId, {
      amount: 10,
      source: XpSource.TRANSACTION_LOGGED,
      referenceId: fromTx.id,
      description: 'Transferencia registrada',
    });

    return { fromTransaction: fromTx, toTransaction: toTx };
  }
}