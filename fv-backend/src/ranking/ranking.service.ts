import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_TRANSACTIONS = 200;
const MAX_STREAK_DAYS = 30;
const MAX_MODULES = 20;
const MAX_LESSONS = 100;
const MAX_GAMES = 50;
const MAX_ACHIEVEMENTS = 30;
const MAX_REWARDS = 20;
const MAX_XP = 10000;

interface QuizAgg {
  userId: string;
  avgScore: number;
}

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) { }

  async getRanking(page: number = 1, limit: number = 10) {
    const total = await this.prisma.user.count({ where: { isActive: true } });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: {
        profile: { select: { displayName: true, avatarUrl: true } },
        gameStats: true,
        statistics: true,
        _count: { select: { rewards: true } },
      },
    });

    const quizAggs = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      _avg: { score: true },
    });
    const quizMap = new Map<string, number>(
      quizAggs.map((q) => [q.userId, q._avg.score ?? 0]),
    );

    const scored = users.map((user) => {
      const stats = user.statistics!;
      const gameStats = user.gameStats!;
      const avgScore = quizMap.get(user.id) ?? 0;
      const rewardsCount = user._count.rewards;
      const score = this.calculateScore(
        stats,
        gameStats,
        avgScore,
        rewardsCount,
      );
      return {
        userId: user.id,
        displayName: user.profile?.displayName ?? 'Usuario',
        avatarUrl: user.profile?.avatarUrl ?? null,
        rank: gameStats.rank,
        level: gameStats.level,
        score: score.total,
        breakdown: score.breakdown,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const start = (page - 1) * limit;
    const paged = scored.slice(start, start + limit);

    const data = paged.map((u, i) => ({
      ...u,
      position: start + i + 1,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async getUserRanking(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        profile: { select: { displayName: true, avatarUrl: true } },
        gameStats: true,
        statistics: true,
        _count: { select: { rewards: true } },
      },
    });

    if (!user) return null;

    const quizAgg = await this.prisma.quizAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
    });
    const avgScore = quizAgg._avg.score ?? 0;

    const allUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      include: {
        statistics: true,
        gameStats: true,
        _count: { select: { rewards: true } },
      },
    });

    const quizAggs = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      _avg: { score: true },
    });
    const quizMap = new Map<string, number>(
      quizAggs.map((q) => [q.userId, q._avg.score ?? 0]),
    );

    const scored = allUsers.map((u) => {
      const s = u.statistics!;
      const gs = u.gameStats!;
      const aScore = quizMap.get(u.id) ?? 0;
      const rCount = u._count.rewards;
      const sc = this.calculateScore(s, gs, aScore, rCount);
      return { userId: u.id, score: sc.total };
    });

    scored.sort((a, b) => b.score - a.score);
    const position = scored.findIndex((u) => u.userId === userId) + 1;

    const stats = user.statistics!;
    const gameStats = user.gameStats!;
    const rewardsCount = user._count.rewards;
    const sc = this.calculateScore(stats, gameStats, avgScore, rewardsCount);

    return {
      position,
      userId: user.id,
      displayName: user.profile?.displayName ?? 'Usuario',
      avatarUrl: user.profile?.avatarUrl ?? null,
      rank: gameStats.rank,
      level: gameStats.level,
      score: sc.total,
      breakdown: sc.breakdown,
    };
  }

  async updateRanking(): Promise<{ updated: number }> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: {
        statistics: true,
        gameStats: true,
        _count: { select: { rewards: true } },
      },
    });

    const quizAggs = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      _avg: { score: true },
    });
    const quizMap = new Map<string, number>(
      quizAggs.map((q) => [q.userId, q._avg.score ?? 0]),
    );

    const scored = users.map((u) => {
      const stats = u.statistics!;
      const gs = u.gameStats!;
      const avgScore = quizMap.get(u.id) ?? 0;
      const rewardsCount = u._count.rewards;
      const sc = this.calculateScore(stats, gs, avgScore, rewardsCount);
      return { userId: u.id, score: sc.total };
    });

    scored.sort((a, b) => b.score - a.score);

    return { updated: scored.length };
  }

  private calculateScore(
    stats: { totalTransactions: number; modulesCompleted: number; lessonsCompleted: number; quizzesCompleted: number; quizzesPassed: number; gamesPlayed: number; gamesWon: number; achievementsCount: number },
    gameStats: { currentStreak: number; xp: number },
    avgQuizScore: number,
    rewardsCount: number,
  ) {
    const txScore = Math.min(stats.totalTransactions / MAX_TRANSACTIONS, 1) * 100;

    const streakScore = Math.min(gameStats.currentStreak / MAX_STREAK_DAYS, 1) * 100;

    const modulesScore = Math.min(stats.modulesCompleted / MAX_MODULES, 1) * 100;
    const lessonsScore = Math.min(stats.lessonsCompleted / MAX_LESSONS, 1) * 100;
    const approvalRate = stats.quizzesCompleted > 0
      ? stats.quizzesPassed / stats.quizzesCompleted
      : 0;
    const quizScore = avgQuizScore * 0.6 + approvalRate * 100 * 0.4;
    const academicScore = (modulesScore + lessonsScore + quizScore) / 3;

    const matchScore = Math.min(stats.gamesPlayed / MAX_GAMES, 1) * 50;
    const winRate = stats.gamesPlayed > 0
      ? (stats.gamesWon / stats.gamesPlayed) * 50
      : 0;
    const simulatorScore = matchScore + winRate;

    const achievementsScore = Math.min(stats.achievementsCount / MAX_ACHIEVEMENTS, 1) * 60;
    const rewardsScore = Math.min(rewardsCount / MAX_REWARDS, 1) * 40;
    const achievementTotal = achievementsScore + rewardsScore;

    const xpScore = Math.min(gameStats.xp / MAX_XP, 1) * 100;

    const total = Math.round(
      (txScore * 0.15 +
        streakScore * 0.15 +
        academicScore * 0.25 +
        simulatorScore * 0.15 +
        achievementTotal * 0.15 +
        xpScore * 0.15) *
      100,
    ) / 100;

    const breakdown = {
      activity: Math.round(txScore),
      consistency: Math.round(streakScore),
      academic: Math.round(academicScore),
      simulator: Math.round(simulatorScore),
      achievements: Math.round(achievementTotal),
      xp: Math.round(xpScore),
    };

    return { total, breakdown };
  }
}
