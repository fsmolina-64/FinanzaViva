import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { XpSource } from '@prisma/client';

@Injectable()
export class FinancesService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) { }


  async createAccount(userId: string, dto: CreateAccountDto) {
    const initAmt = dto.initialBalance ?? 0;

    const account = await this.prisma.financialAccount.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        isDefault: dto.isDefault ?? false,
        balance: 0,
      },
    });

    if (initAmt > 0) {
      const isRealIncome = dto.countAsIncome === true;
      await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            amount: initAmt,
            type: 'INCOME',
            description: `Balance inicial de ${dto.name}`,
            date: new Date(),
            isInitialBalance: !isRealIncome,
          },
        }),
        this.prisma.financialAccount.update({
          where: { id: account.id },
          data: { balance: { increment: initAmt } },
        }),
        this.prisma.userStatistics.update({
          where: { userId },
          data: { totalTransactions: { increment: 1 } },
        }),
      ]);
    }

    return this.prisma.financialAccount.findUnique({ where: { id: account.id } });
  }

  async getAccounts(userId: string) {
    return this.prisma.financialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateAccount(userId: string, accountId: string, dto: UpdateAccountDto) {
    const account = await this.prisma.financialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.userId !== userId) throw new ForbiddenException();

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.balance !== undefined) data.balance = dto.balance;

    return this.prisma.financialAccount.update({
      where: { id: accountId },
      data,
    });
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
      include: {
        transactions: {
          where: { isInitialBalance: false },
          take: 1,
        },
      },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    if (account.userId !== userId) throw new ForbiddenException();
    if (account.transactions.length > 0) {
      throw new BadRequestException(
        'No puedes eliminar esta cuenta porque tiene transacciones asociadas. Elimina primero las transacciones.',
      );
    }
    // Delete any initial-balance transactions along with the account
    await this.prisma.transaction.deleteMany({ where: { accountId, isInitialBalance: true } });
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
          where: { userId, categoryId: dto.categoryId, type: 'EXPENSE', date: { gte: startOfMonth } },
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

  async updateTransaction(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    if (tx.userId !== userId) throw new ForbiddenException();

    const newAccountId = dto.accountId ?? tx.accountId;
    const newType = dto.type ?? tx.type;
    const newAmount = dto.amount ?? Number(tx.amount);
    const sameAccount = newAccountId === tx.accountId;

    if (!sameAccount) {
      const newAcc = await this.prisma.financialAccount.findUnique({ where: { id: newAccountId } });
      if (!newAcc || newAcc.userId !== userId) throw new ForbiddenException('Cuenta no valida');
    }

    const revertDelta = tx.type === 'INCOME' ? -Number(tx.amount) : Number(tx.amount);
    const applyDelta = newType === 'INCOME' ? newAmount : -newAmount;

    const balanceOps = sameAccount
      ? [this.prisma.financialAccount.update({
        where: { id: tx.accountId },
        data: { balance: { increment: revertDelta + applyDelta } },
      })]
      : [
        this.prisma.financialAccount.update({
          where: { id: tx.accountId },
          data: { balance: { increment: revertDelta } },
        }),
        this.prisma.financialAccount.update({
          where: { id: newAccountId },
          data: { balance: { increment: applyDelta } },
        }),
      ];

    const results = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.accountId && { accountId: dto.accountId }),
        categoryId: dto.categoryId ?? null,
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type && { type: dto.type }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.date && { date: new Date(dto.date) }),
        },
        include: { category: true, account: true },
      }),
      ...balanceOps,
    ]);

    return results[0];
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    if (tx.userId !== userId) throw new ForbiddenException();

    const balanceDelta = tx.type === 'INCOME' ? -Number(tx.amount) : Number(tx.amount);

    await this.prisma.$transaction([
      this.prisma.transaction.delete({ where: { id: transactionId } }),
      this.prisma.financialAccount.update({
        where: { id: tx.accountId },
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
    const hidden = await this.prisma.userHiddenCategory.findMany({
      where: { userId },
      select: { categoryId: true },
    });
    const hiddenIds = new Set(hidden.map(h => h.categoryId));

    const all = await this.prisma.category.findMany({
      where: { OR: [{ isGlobal: true }, { userId }] },
      orderBy: { name: 'asc' },
    });

    // Filter out global categories that the user has hidden or overridden
    const userCatIds = new Set(all.filter(c => c.userId === userId).map(c => c.originalCategoryId).filter(Boolean));
    return all.filter(c =>
      !c.isGlobal ||
      (!hiddenIds.has(c.id) && !userCatIds.has(c.id))
    );
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon ?? 'help-circle',
        color: dto.color ?? '#6b7280',
        isGlobal: false,
      },
    });
  }

  async updateCategory(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.userId && category.userId !== userId) throw new ForbiddenException();

    // Global category: create a user-specific override instead of modifying in-place
    if (!category.userId) {
      return this.prisma.category.create({
        data: {
          userId,
          name: dto.name ?? category.name,
          type: category.type,
          icon: dto.icon ?? category.icon,
          color: dto.color ?? category.color,
          isGlobal: false,
          originalCategoryId: category.id,
        },
      });
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
  }

  async deleteCategory(userId: string, categoryId: string, reassignToId?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { transactions: true, budgets: true } } },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (category.userId && category.userId !== userId) throw new ForbiddenException();

    const txCount = category._count.transactions;

    // Handle reassignment before hiding/deleting
    if (txCount > 0) {
      if (!reassignToId) {
        throw new BadRequestException(
          `La categoría tiene ${txCount} transacción(es) asociadas. Proporciona reassignToId para reasignarlas antes de eliminar`,
        );
      }
      const target = await this.prisma.category.findUnique({ where: { id: reassignToId } });
      if (!target) throw new BadRequestException('La categoría de reasignación no existe');

      await this.prisma.transaction.updateMany({
        where: { categoryId },
        data: { categoryId: reassignToId },
      });
    }

    // Global category: hide it for this user instead of deleting
    if (!category.userId) {
      await this.prisma.userHiddenCategory.create({
        data: { userId, categoryId },
      });
      return { message: 'Categoría oculta para este usuario.' };
    }

    if (txCount > 0) {
      return { message: 'Categoría eliminada y transacciones reasignadas' };
    }

    return this.prisma.category.delete({ where: { id: categoryId } });
  }


  async createBudget(userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId,
        ...(dto.categoryId && { categoryId: dto.categoryId }),
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

  async updateBudget(userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.userId !== userId) throw new ForbiddenException();

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Categoría no encontrada');
      if (category.userId && category.userId !== userId) throw new ForbiddenException('La categoría no te pertenece');
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : undefined }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.period && { period: dto.period }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      },
      include: { category: true },
    });
  }

  async deleteBudget(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    if (budget.userId !== userId) throw new ForbiddenException();

    await this.prisma.budget.delete({ where: { id: budgetId } });
    return { message: 'Presupuesto eliminado' };
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

  async updateGoal(userId: string, goalId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.financialGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.userId !== userId) throw new ForbiddenException();

    if (dto.fromAccountId !== undefined && dto.currentAmount !== undefined) {
      const account = await this.prisma.financialAccount.findUnique({ where: { id: dto.fromAccountId } });
      if (!account || account.userId !== userId) throw new ForbiddenException();

      const deposit = dto.currentAmount - Number(goal.currentAmount);
      const results = await this.prisma.$transaction([
        this.prisma.financialGoal.update({
          where: { id: goalId },
          data: {
            currentAmount: dto.currentAmount,
            ...(dto.currentAmount >= Number(goal.targetAmount) && { status: 'COMPLETED' }),
          },
        }),
        this.prisma.financialAccount.update({
          where: { id: dto.fromAccountId },
          data: { balance: { decrement: deposit > 0 ? deposit : 0 } },
        }),
      ]);
      return results[0];
    }

    return this.prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
        ...(dto.currentAmount !== undefined && { currentAmount: dto.currentAmount }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.prisma.financialGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.userId !== userId) throw new ForbiddenException();

    await this.prisma.financialGoal.delete({ where: { id: goalId } });
    return { message: 'Meta eliminada' };
  }


  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('No puedes transferir a la misma cuenta');
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.financialAccount.findUnique({ where: { id: dto.fromAccountId } }),
      this.prisma.financialAccount.findUnique({ where: { id: dto.toAccountId } }),
    ]);

    if (!fromAccount || fromAccount.userId !== userId) throw new ForbiddenException();
    if (!toAccount || toAccount.userId !== userId) throw new ForbiddenException();

    const systemCategory = await this.prisma.category.findFirst({ where: { isGlobal: true } });
    if (!systemCategory) throw new BadRequestException('No hay categorías disponibles');

    const groupId = crypto.randomUUID();

    const results = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.fromAccountId,
          categoryId: systemCategory.id,
          amount: dto.amount,
          type: 'TRANSFER',
          description: dto.description ?? `Transferencia a ${toAccount.name}`,
          date: new Date(dto.date),
          transferGroupId: groupId,
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.toAccountId,
          categoryId: systemCategory.id,
          amount: dto.amount,
          type: 'TRANSFER',
          description: dto.description ?? `Transferencia desde ${fromAccount.name}`,
          date: new Date(dto.date),
          transferGroupId: groupId,
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
    ]);

    return { fromTransaction: results[0], toTransaction: results[1] };
  }

  async deleteTransferByGroup(userId: string, groupId: string) {
    const txs = await this.prisma.transaction.findMany({ where: { transferGroupId: groupId, userId } });
    if (txs.length === 0) throw new NotFoundException('Transferencia no encontrada');

    const fromTx = txs.find(t => {
      const acc = txs.find(other => other.id !== t.id);
      return acc && t.accountId !== acc.accountId;
    });
    const revertOps = txs.map(tx => {
      const other = txs.find(t2 => t2.id !== tx.id);
      const isFrom = other ? tx.accountId !== other.accountId : true;
      return this.prisma.financialAccount.update({
        where: { id: tx.accountId },
        data: { balance: { increment: isFrom ? Number(tx.amount) : -Number(tx.amount) } },
      });
    });

    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany({ where: { transferGroupId: groupId } }),
      ...revertOps,
    ]);
    return { message: 'Transferencia eliminada' };
  }

  async updateTransfer(userId: string, groupId: string, dto: { fromAccountId?: string; toAccountId?: string; amount?: number; description?: string; date?: string }) {
    const txs = await this.prisma.transaction.findMany({
      where: { transferGroupId: groupId, userId },
      orderBy: { date: 'asc' },
    });
    if (txs.length !== 2) throw new NotFoundException('Transferencia no encontrada');

    const oldFromTx = txs.find(t => t.accountId === dto.fromAccountId || !txs.find(other => other.id !== t.id && other.accountId === dto.fromAccountId)) ?? txs[0];
    const oldToTx = txs.find(t => t.id !== oldFromTx.id)!;
    const oldFromAcc = oldFromTx.accountId;
    const oldToAcc = oldToTx.accountId;
    const newFromAcc = dto.fromAccountId ?? oldFromAcc;
    const newToAcc = dto.toAccountId ?? oldToAcc;
    const newAmt = dto.amount ?? Number(oldFromTx.amount);

    const ops: any[] = [];

    ops.push(this.prisma.financialAccount.update({ where: { id: oldFromAcc }, data: { balance: { increment: Number(oldFromTx.amount) } } }));
    ops.push(this.prisma.financialAccount.update({ where: { id: oldToAcc }, data: { balance: { decrement: Number(oldToTx.amount) } } }));

    const fromData: any = { accountId: newFromAcc, amount: newAmt, description: dto.description !== undefined ? dto.description : oldFromTx.description };
    const toData: any = { accountId: newToAcc, amount: newAmt, description: dto.description !== undefined ? dto.description : undefined };
    if (dto.date) { fromData.date = new Date(dto.date); toData.date = new Date(dto.date); }

    ops.push(this.prisma.transaction.update({ where: { id: oldFromTx.id }, data: fromData }));
    ops.push(this.prisma.transaction.update({ where: { id: oldToTx.id }, data: toData }));

    ops.push(this.prisma.financialAccount.update({ where: { id: newFromAcc }, data: { balance: { decrement: newAmt } } }));
    ops.push(this.prisma.financialAccount.update({ where: { id: newToAcc }, data: { balance: { increment: newAmt } } }));

    const results = await this.prisma.$transaction(ops);
    return { fromTransaction: results[2], toTransaction: results[3] };
  }


  async getSummary(userId: string) {
    const accounts = await this.prisma.financialAccount.findMany({ where: { userId } });
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyTxs = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
    });

    const income = monthlyTxs.filter(t => t.type === 'INCOME' && !t.isInitialBalance).reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthlyTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

    return { totalBalance, monthlyIncome: income, monthlyExpenses: expenses };
  }

  async getBudgetHealth(userId: string) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      include: { category: true },
    });

    const income = transactions.filter(t => t.type === 'INCOME' && !t.isInitialBalance).reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    const available = income - expenses;
    const percentage = income > 0 ? Math.round((expenses / income) * 100) : 0;

    let status: string;
    let message: string;

    if (percentage >= 100) {
      status = 'CRITICAL';
      message = `Gastaste mas de lo que ganaste. Deficit de $${Math.abs(available).toFixed(2)}`;
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

    const breakdown = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc: Record<string, number>, t) => {
        if (!t.category) return acc;
        const cat = t.category.name;
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {});

    return { income, expenses, available, percentage, status, message, breakdown };
  }
}