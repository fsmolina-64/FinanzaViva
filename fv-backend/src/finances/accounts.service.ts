import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

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
    await this.prisma.transaction.deleteMany({ where: { accountId, isInitialBalance: true } });
    return this.prisma.financialAccount.delete({ where: { id: accountId } });
  }
}
