import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { XpSource, BudgetPeriod } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  private getPeriodStart(period: BudgetPeriod, refDate?: Date): Date {
    const now = refDate ?? new Date();
    switch (period) {
      case 'WEEKLY': {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      }
      case 'MONTHLY':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: dto.accountId },
    });
    if (!account || account.userId !== userId) throw new ForbiddenException();

    if (dto.type === 'EXPENSE' && !dto.allowNegative && !dto.isInitialBalance) {
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
          isInitialBalance: dto.isInitialBalance ?? false,
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
        const periodStart = this.getPeriodStart(budget.period);
        const spent = await this.prisma.transaction.aggregate({
          where: { userId, categoryId: dto.categoryId, type: 'EXPENSE', date: { gte: periodStart } },
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

    // Check if this is a savings transaction
    const isSavingsTx = tx.type === 'EXPENSE' && tx.description?.startsWith('Ahorro para meta: ');
    
    if (tx.isInitialBalance || tx.description?.startsWith('Ajuste de balance') || tx.description?.startsWith('Balance inicial')) {
      throw new BadRequestException('No puedes editar un ajuste de balance');
    }

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

    let goalUpdateOp = null;
    if (isSavingsTx && dto.amount !== undefined && dto.amount !== Number(tx.amount) && tx.description) {
      // Update goal currentAmount based on the amount difference
      const goalName = tx.description.replace('Ahorro para meta: ', '');
      const goal = await this.prisma.financialGoal.findFirst({
        where: { userId, name: goalName },
      });
      if (goal) {
        const amountDiff = dto.amount - Number(tx.amount);
        goalUpdateOp = this.prisma.financialGoal.update({
          where: { id: goal.id },
          data: { 
            currentAmount: { increment: amountDiff },
            // Reset to ACTIVE if it was completed and amount decreased
            ...(amountDiff < 0 && goal.status === 'COMPLETED' && { status: 'ACTIVE' }),
          },
        });
      }
    }

    const ops = [
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.accountId && { accountId: dto.accountId }),
          categoryId: dto.categoryId ?? null,
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type && { type: dto.type }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.date && { date: new Date(dto.date) }),
          ...(dto.isInitialBalance !== undefined && { isInitialBalance: dto.isInitialBalance }),
        },
        include: { category: true, account: true },
      }),
      ...balanceOps,
    ];

    const results = await this.prisma.$transaction(async (prisma) => {
      const txResult = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.accountId && { accountId: dto.accountId }),
          categoryId: dto.categoryId ?? null,
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type && { type: dto.type }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.date && { date: new Date(dto.date) }),
          ...(dto.isInitialBalance !== undefined && { isInitialBalance: dto.isInitialBalance }),
        },
        include: { category: true, account: true },
      });

      for (const op of balanceOps) {
        await op;
      }

      if (goalUpdateOp) {
        await goalUpdateOp;
      }

      return [txResult];
    });

    return results[0];
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    if (tx.userId !== userId) throw new ForbiddenException();

    const balanceDelta = tx.type === 'INCOME' ? -Number(tx.amount) : Number(tx.amount);

    // Check if this is a savings transaction for a goal
    const isSavingsTx = tx.type === 'EXPENSE' && (tx.description ?? '').startsWith('Ahorro para meta: ');
    
    let goalName: string | null = null;
    if (isSavingsTx) {
      goalName = (tx.description ?? '').replace('Ahorro para meta: ', '');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Delete the transaction
      await prisma.transaction.delete({ where: { id: transactionId } });

      // Update account balance
      await prisma.financialAccount.update({
        where: { id: tx.accountId },
        data: { balance: { increment: balanceDelta } },
      });

      // Update user statistics
      await prisma.userStatistics.update({
        where: { userId },
        data: { totalTransactions: { decrement: 1 } },
      });

      // If it's a savings transaction, update the goal
      if (isSavingsTx && goalName) {
        const goal = await prisma.financialGoal.findFirst({
          where: { userId, name: goalName },
        });
        if (goal) {
          await prisma.financialGoal.update({
            where: { id: goal.id },
            data: { 
              currentAmount: { decrement: Number(tx.amount) },
              status: 'ACTIVE', // Reset status if it was completed
            },
          });
        }
      }
    });

    return { message: 'Transacción eliminada' };
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

  async deleteTransferByGroup(userId: string, groupId: string) {
    const txs = await this.prisma.transaction.findMany({ where: { transferGroupId: groupId, userId } });
    if (txs.length === 0) throw new NotFoundException('Transferencia no encontrada');

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
}
