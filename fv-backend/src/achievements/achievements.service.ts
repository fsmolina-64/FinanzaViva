import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { UserActionEvent } from '../common/events/user-action.event';

@Injectable()
export class AchievementsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async evaluate(userId: string) {
    const stats = await this.prisma.userStatistics.findUnique({ where: { userId } });
    const gameStats = await this.prisma.userGameStats.findUnique({ where: { userId } });
    if (!stats || !gameStats) return;

    const achievements = await this.prisma.achievement.findMany({ where: { isActive: true } });
    const unlocked = await this.prisma.userAchievement.findMany({ where: { userId } });
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const condition = achievement.condition as { metric: string; threshold: number };
      const value = this.getMetricValue(stats, gameStats, condition.metric);

      if (value >= condition.threshold) {
        await this.unlock(userId, achievement.id, achievement.xpReward);
      }
    }
  }

  private getMetricValue(stats: any, gameStats: any, metric: string): number {
    const map: Record<string, number> = {
      quizzes_passed:     stats.quizzesPassed,
      lessons_completed:  stats.lessonsCompleted,
      modules_completed:  stats.modulesCompleted,
      games_played:       stats.gamesPlayed,
      games_won:          stats.gamesWon,
      total_transactions: stats.totalTransactions,
      total_xp:           stats.totalXpEarned,
      current_streak:     gameStats.currentStreak,
      longest_streak:     gameStats.longestStreak,
      level:              gameStats.level,
    };
    return map[metric] ?? 0;
  }

  private async unlock(userId: string, achievementId: string, xpReward: number) {
    await this.prisma.userAchievement.create({
      data: { userId, achievementId },
    });

    await this.prisma.userStatistics.update({
      where: { userId },
      data: { achievementsCount: { increment: 1 } },
    });

    if (xpReward > 0) {
      await this.gamification.addXp(userId, {
        amount: xpReward,
        source: XpSource.ACHIEVEMENT_UNLOCKED,
        referenceId: achievementId,
        description: 'Logro desbloqueado',
      });
    }

    await this.checkRewards(userId);
  }

  async checkRewards(userId: string) {
    const gameStats = await this.prisma.userGameStats.findUnique({ where: { userId } });
    const userStats = await this.prisma.userStatistics.findUnique({ where: { userId } });
    if (!gameStats || !userStats) return;

    const rewards = await this.prisma.reward.findMany({ where: { isActive: true } });
    const unlocked = await this.prisma.userReward.findMany({ where: { userId } });
    const unlockedIds = new Set(unlocked.map((r) => r.rewardId));

    for (const reward of rewards) {
      if (unlockedIds.has(reward.id)) continue;

      let shouldUnlock = false;

      if (reward.unlockType === 'LEVEL') {
        shouldUnlock = gameStats.level >= parseInt(reward.unlockValue);
      } else if (reward.unlockType === 'RANK') {
        shouldUnlock = gameStats.rank === reward.unlockValue;
      } else if (reward.unlockType === 'XP_TOTAL') {
        shouldUnlock = userStats.totalXpEarned >= parseInt(reward.unlockValue);
      } else if (reward.unlockType === 'ACHIEVEMENT') {
        const hasAchievement = await this.prisma.userAchievement.findFirst({
          where: { userId, achievement: { key: reward.unlockValue } },
        });
        shouldUnlock = !!hasAchievement;
      }

      if (shouldUnlock) {
        await this.prisma.userReward.create({
          data: { userId, rewardId: reward.id },
        });
      }
    }
  }

  async getUserAchievements(userId: string) {
    const all = await this.prisma.achievement.findMany({ where: { isActive: true } });
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    return all.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt ?? null,
    }));
  }

  async getUserRewards(userId: string) {
    const all = await this.prisma.reward.findMany({ where: { isActive: true } });
    const unlocked = await this.prisma.userReward.findMany({ where: { userId } });
    const unlockedIds = new Set(unlocked.map((r) => r.rewardId));

    return all.map((r) => ({
      ...r,
      unlocked: unlockedIds.has(r.id),
      isEquipped: unlocked.find((u) => u.rewardId === r.id)?.isEquipped ?? false,
    }));
  }

  async equipReward(userId: string, rewardId: string) {
    return this.prisma.userReward.update({
      where: { userId_rewardId: { userId, rewardId } },
      data: { isEquipped: true },
    });
  }

  @OnEvent('user.action')
  async handleUserAction(event: UserActionEvent) {
    await this.evaluate(event.userId);
  }
}