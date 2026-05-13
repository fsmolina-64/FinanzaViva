import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddXpDto } from './dto/add-xp.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserActionEvent } from '../common/events/user-action.event';

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async addXp(userId: string, dto: AddXpDto) {
    await this.prisma.xpTransaction.create({
      data: {
        userId,
        amount: dto.amount,
        source: dto.source,
        referenceId: dto.referenceId,
        description: dto.description,
      },
    });

    const stats = await this.prisma.userGameStats.update({
      where: { userId },
      data: { xp: { increment: dto.amount } },
    });

    const newLevel = await this.checkLevelUp(userId, stats.xp);

    await this.prisma.userStatistics.update({
      where: { userId },
      data: { totalXpEarned: { increment: dto.amount } },
    });

    this.eventEmitter.emit('user.action', new UserActionEvent(userId));

    return {
      xp: stats.xp,
      level: newLevel?.number ?? stats.level,
      leveledUp: !!newLevel,
    };
  }

  async getStats(userId: string) {
    return this.prisma.userGameStats.findUnique({
      where: { userId },
    });
  }

  async updateStreak(userId: string) {
    const stats = await this.prisma.userGameStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    const now = new Date();
    const last = stats.lastActivityAt;

    const diffDays = last
      ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let newStreak = stats.currentStreak;

    if (diffDays === null || diffDays > 1) {
      newStreak = 1;
    } else if (diffDays === 1) {
      newStreak += 1;
    }

    const longestStreak = Math.max(newStreak, stats.longestStreak);

    return this.prisma.userGameStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityAt: now,
      },
    });
  }

  private async checkLevelUp(userId: string, currentXp: number) {
    const nextLevel = await this.prisma.level.findFirst({
      where: { xpRequired: { lte: currentXp } },
      orderBy: { number: 'desc' },
    });

    if (!nextLevel) return null;

    const stats = await this.prisma.userGameStats.findUnique({
      where: { userId },
    });

    if (!stats || stats.level >= nextLevel.number) return null;

    await this.prisma.userGameStats.update({
      where: { userId },
      data: {
        level: nextLevel.number,
        rank: nextLevel.rank,
      },
    });

    return nextLevel;
  }
}