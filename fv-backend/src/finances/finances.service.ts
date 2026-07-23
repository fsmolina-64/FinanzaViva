import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) { }

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

    const userCatIds = new Set(all.filter(c => c.userId === userId).map(c => c.originalCategoryId).filter(Boolean));
    return all.filter(c =>
      !c.isGlobal ||
      (!hiddenIds.has(c.id) && !userCatIds.has(c.id))
    );
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    // Check if user already has a category with the same name AND type
    // OR if there's a global category with the same name AND type
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        OR: [
          { userId, name: dto.name, type: dto.type },
          { isGlobal: true, name: dto.name, type: dto.type },
        ],
      },
    });
    if (existingCategory) {
      const scope = existingCategory.isGlobal ? 'predefinida' : 'tuya';
      throw new BadRequestException(
        `Ya existe una categoría de ${dto.type === 'INCOME' ? 'ingreso' : 'gasto'} ${scope} con el nombre "${dto.name}".`
      );
    }

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

    // Check if renaming would create a duplicate (check user categories AND global categories)
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { userId, name: dto.name, type: category.type },
            { isGlobal: true, name: dto.name, type: category.type },
          ],
          NOT: { id: categoryId },
        },
      });
      if (existingCategory) {
        const scope = existingCategory.isGlobal ? 'predefinida' : 'tuya';
        throw new BadRequestException(
          `Ya existe una categoría de ${category.type === 'INCOME' ? 'ingreso' : 'gasto'} ${scope} con el nombre "${dto.name}".`
        );
      }
    }

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
    // Check if user already has a budget for this category
    if (dto.categoryId) {
      const existingBudget = await this.prisma.budget.findFirst({
        where: { userId, categoryId: dto.categoryId },
      });
      if (existingBudget) {
        throw new BadRequestException(
          `Ya existe un presupuesto para esta categoría`
        );
      }
    }

    return this.prisma.budget.create({
      data: {
        userId,
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        amount: dto.amount,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { category: true },
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

      const targetAmount = Number(goal.targetAmount);
      const currentAmount = Number(goal.currentAmount);
      const newCurrentAmount = dto.currentAmount;
      
      // Cap at target amount - don't allow saving more than the goal target
      const cappedAmount = Math.min(newCurrentAmount, targetAmount);
      const deposit = cappedAmount - currentAmount;

      if (deposit <= 0) {
        return goal; // No actual change needed
      }

      // Check account has enough balance
      if (deposit > Number(account.balance)) {
        throw new BadRequestException('Saldo insuficiente en la cuenta');
      }

      // Find or create a "Savings" category for tracking
      let savingsCategory = await this.prisma.category.findFirst({
        where: { userId, name: 'Ahorros', type: 'EXPENSE' },
      });
      if (!savingsCategory) {
        savingsCategory = await this.prisma.category.create({
          data: {
            userId,
            name: 'Ahorros',
            type: 'EXPENSE',
            icon: 'piggy-bank',
            color: '#10b981',
            isGlobal: false,
          },
        });
      }

      const results = await this.prisma.$transaction([
        this.prisma.financialGoal.update({
          where: { id: goalId },
          data: {
            currentAmount: cappedAmount,
            ...(cappedAmount >= targetAmount && { status: 'COMPLETED' }),
          },
        }),
        this.prisma.financialAccount.update({
          where: { id: dto.fromAccountId },
          data: { balance: { decrement: deposit } },
        }),
        this.prisma.transaction.create({
          data: {
            userId,
            accountId: dto.fromAccountId,
            categoryId: savingsCategory.id,
            amount: deposit,
            type: 'EXPENSE',
            description: `Ahorro para meta: ${goal.name}`,
            date: new Date(),
          },
        }),
      ]);
      return results[0];
    }

    // Handle targetAmount reduction below currentAmount
    if (dto.targetAmount !== undefined && dto.targetAmount < Number(goal.currentAmount)) {
      return this.handleTargetReduction(userId, goalId, goal, dto.targetAmount);
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

  // Helper: handle targetAmount reduction below currentAmount
  private async handleTargetReduction(
    userId: string,
    goalId: string,
    goal: any,
    newTargetAmount: number,
  ) {
    const currentAmount = Number(goal.currentAmount);
    const excess = currentAmount - newTargetAmount;

    // Find savings transactions to determine which account to refund
    const savingsTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        description: { startsWith: `Ahorro para meta: ${goal.name}` },
        type: 'EXPENSE',
      },
      orderBy: { date: 'desc' },
    });

    if (savingsTransactions.length === 0) {
      throw new BadRequestException(
        'No se puede reducir la meta por debajo del ahorro actual sin transacciones de ahorro',
      );
    }

    // Refund excess to the most recent account used for savings
    const latestTx = savingsTransactions[0];

    await this.prisma.$transaction([
      this.prisma.financialAccount.update({
        where: { id: latestTx.accountId },
        data: { balance: { increment: excess } },
      }),
      this.prisma.financialGoal.update({
        where: { id: goalId },
        data: {
          targetAmount: newTargetAmount,
          currentAmount: newTargetAmount, // Cap current amount to new target
          status: 'COMPLETED',
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: latestTx.accountId,
          categoryId: latestTx.categoryId,
          amount: excess,
          type: 'INCOME',
          description: `Devolución por reducción de meta: ${goal.name}`,
          date: new Date(),
        },
      }),
    ]);

    return { message: `Meta actualizada. Se devolvieron $${excess.toFixed(2)} a la cuenta` };
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.prisma.financialGoal.findUnique({ 
      where: { id: goalId }
    });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    if (goal.userId !== userId) throw new ForbiddenException();

    // Find savings transactions for this goal and return money to accounts
    const savingsTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        description: { startsWith: `Ahorro para meta: ${goal.name}` },
        type: 'EXPENSE',
      },
    });

    if (savingsTransactions.length > 0) {
      await this.prisma.$transaction([
        ...savingsTransactions.map(tx => 
          this.prisma.financialAccount.update({
            where: { id: tx.accountId },
            data: { balance: { increment: Number(tx.amount) } },
          })
        ),
        this.prisma.transaction.deleteMany({
          where: {
            userId,
            description: { startsWith: `Ahorro para meta: ${goal.name}` },
            type: 'EXPENSE',
          },
        }),
        this.prisma.financialGoal.delete({ where: { id: goalId } }),
      ]);
    } else {
      await this.prisma.financialGoal.delete({ where: { id: goalId } });
    }

    return { message: 'Meta eliminada y ahorros devueltos a las cuentas' };
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
