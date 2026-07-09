import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinancesService } from '../finances.service';
import { PdfReportData, PdfTransferGroup } from './pdf-report.types';

interface RawTransferLeg {
  accountId: string;
  type: string;
  transferGroupId: string | null;
  amount: { toString(): string };
  description: string | null;
  date: Date;
}

@Injectable()
export class PdfReportDataService {
  constructor(
    private prisma: PrismaService,
    private financesService: FinancesService,
  ) {}

  /**
   * Trae TODO el historial del usuario (no filtrado por período).
   * El filtrado por from/to lo hace PdfReportService, porque
   * calcHistoricalBalances necesita ver transacciones posteriores al "to"
   * para poder revertirlas y reconstruir el balance de cada cuenta al
   * cierre del período. Si esta query se restringe por fecha, los saldos
   * de "Estado de cuentas" quedan mal calculados sin que nada tire error.
   */
  async buildReportData(userId: string): Promise<PdfReportData> {
    const [profile, accounts, transactions, budgets, goals, categories] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.financialAccount.findMany({ where: { userId } }),
      this.prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      this.prisma.budget.findMany({ where: { userId } }),
      this.prisma.financialGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.financesService.getCategories(userId),
    ]);

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return {
      userName: profile.displayName,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.balance.toString(),
        createdAt: a.createdAt.toISOString(),
      })),
      transactions: transactions.map(t => ({
        id: t.id,
        accountId: t.accountId,
        categoryId: t.categoryId,
        amount: t.amount.toString(),
        type: t.type,
        description: t.description,
        date: t.date.toISOString(),
        transferGroupId: t.transferGroupId,
        isInitialBalance: t.isInitialBalance,
      })),
      budgets: budgets.map(b => ({
        id: b.id,
        categoryId: b.categoryId,
        amount: b.amount.toString(),
        period: b.period,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate ? b.endDate.toISOString() : null,
      })),
      goals: goals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount.toString(),
        currentAmount: g.currentAmount.toString(),
        deadline: g.deadline ? g.deadline.toISOString() : null,
        status: g.status,
        createdAt: g.createdAt.toISOString(),
      })),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isGlobal: c.isGlobal,
        userId: c.userId,
      })),
      transferGroups: this.buildTransferGroups(transactions),
    };
  }

  /**
   * Puerto exacto de fv-frontend/src/app/features/finances/finances.ts,
   * triggerExport() (líneas 1161-1179).
   *
   * El heurístico original elige la pata "from" con
   * `find(t => accountId !== other.accountId)`, condición simétrica entre
   * las dos patas de la transferencia → siempre resuelve al primer elemento
   * del grupo. Acá se simplifica directo a g[0]/g[1] sin cambiar el resultado.
   */
  private buildTransferGroups(transactions: RawTransferLeg[]): PdfTransferGroup[] {
    const map = new Map<string, RawTransferLeg[]>();
    for (const tx of transactions) {
      if (tx.type === 'TRANSFER' && tx.transferGroupId) {
        const g = map.get(tx.transferGroupId) ?? [];
        g.push(tx);
        map.set(tx.transferGroupId, g);
      }
    }

    const groups: PdfTransferGroup[] = [];
    for (const [, g] of map) {
      if (g.length < 2) continue; // pata huérfana (defensivo, no debería pasar)
      const [from, to] = g;
      groups.push({
        groupId: from.transferGroupId!,
        fromAccountId: from.accountId,
        toAccountId: to.accountId,
        amount: Number(from.amount.toString()),
        description: from.description || to.description,
        date: from.date.toISOString(),
      });
    }
    return groups;
  }
}
