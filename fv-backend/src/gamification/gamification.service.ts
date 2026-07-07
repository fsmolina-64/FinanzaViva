import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddXpDto } from './dto/add-xp.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserActionEvent } from '../common/events/user-action.event';
import { XpSource } from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

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

  async grantModuleXpIfFirstTime(userId: string, moduleId: string, amount: number) {
    const existing = await this.prisma.xpTransaction.findFirst({
      where: {
        userId,
        source: XpSource.LESSON_COMPLETED,
        referenceId: moduleId,
      },
    });

    if (existing) {
      return { xp: 0, alreadyAwarded: true, leveledUp: false };
    }

    await this.prisma.xpTransaction.create({
      data: {
        userId,
        amount,
        source: XpSource.LESSON_COMPLETED,
        referenceId: moduleId,
        description: 'Módulo completado',
      },
    });

    const stats = await this.prisma.userGameStats.update({
      where: { userId },
      data: { xp: { increment: amount } },
    });

    await this.prisma.userStatistics.update({
      where: { userId },
      data: { totalXpEarned: { increment: amount } },
    });

    const newLevel = await this.checkLevelUp(userId, stats.xp);

    this.eventEmitter.emit('user.action', new UserActionEvent(userId));

    return {
      xp: stats.xp,
      level: newLevel?.number ?? stats.level,
      leveledUp: !!newLevel,
      alreadyAwarded: false,
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

    if (!stats) return null;

    const now = new Date();
    const last = stats.lastActivityAt;
    const previousStreak = stats.currentStreak;

    const todayCalendar = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCalendar = last
      ? new Date(last.getFullYear(), last.getMonth(), last.getDate())
      : null;

    const diffDays = lastCalendar
      ? Math.floor(
        (todayCalendar.getTime() - lastCalendar.getTime()) / (1000 * 60 * 60 * 24),
      )
      : null;

    if (diffDays === 0) {
      return {
        currentStreak: stats.currentStreak,
        streakStatus: null,
        previousStreak,
        streakEvent: null,
      };
    }

    let newStreak: number;
    let streakStatus: 'ACTIVE' | 'AT_RISK' | 'LOST';
    let streakEvent: 'FIRST_STREAK' | 'STREAK_INCREASED' | 'STREAK_RECOVERED' | 'STREAK_LOST';

    if (diffDays === null) {
      newStreak = 1;
      streakStatus = 'ACTIVE';
      streakEvent = 'FIRST_STREAK';
    } else if (diffDays === 1) {
      newStreak = stats.currentStreak + 1;
      streakStatus = 'ACTIVE';
      streakEvent = 'STREAK_INCREASED';
    } else if (diffDays === 2) {
      newStreak = stats.currentStreak;
      streakStatus = 'AT_RISK';
      streakEvent = 'STREAK_RECOVERED';
    } else {
      newStreak = 1;
      streakStatus = 'LOST';
      streakEvent = 'STREAK_LOST';
    }

    const longestStreak = Math.max(newStreak, stats.longestStreak);

    await this.prisma.userGameStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastActivityAt: now,
      },
    });

    const todayUtcMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    await this.prisma.streakLog.create({
      data: {
        userId,
        date: todayUtcMidnight,
        streak: newStreak,
        status: streakStatus,
      },
    });

    return { currentStreak: newStreak, streakStatus, previousStreak, streakEvent };
  }

  async getStreakHistory(userId: string, month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    return this.prisma.streakLog.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        streak: true,
        status: true,
      },
    });
  }

  async checkAndEmitLevelUp(userId: string) {
    const stats = await this.prisma.userGameStats.findUnique({ where: { userId } });
    if (!stats) return null;

    const newLevel = await this.checkLevelUp(userId, stats.xp);
    if (newLevel) {
      this.eventEmitter.emit('user.action', new UserActionEvent(userId));
    }
    return newLevel;
  }

  public async checkLevelUp(userId: string, currentXp: number) {
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