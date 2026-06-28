import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimulatorStatus } from '@prisma/client';

const CAP_TRANSACTIONS = 200;
const CAP_MODULES = 7;
const CAP_LESSONS = 28;
const CAP_GAMES = 30;
const CAP_ACHIEVEMENTS = 23;
const CAP_REWARDS = 20;
const CAP_XP = 10_000;
const CAP_LEVEL = 10;

type UserSelect = {
  id: string;
  createdAt: Date;
  profile: { displayName: string; avatarUrl: string | null } | null;
  gameStats: { rank: string; level: number; xp: number; currentStreak: number; longestStreak: number } | null;
  statistics: {
    totalTransactions: number; modulesCompleted: number; lessonsCompleted: number;
    quizzesCompleted: number; quizzesPassed: number; distinctPassedQuizzes: number; gamesWon: number; achievementsCount: number;
  } | null;
  _count: { rewards: number };
  rewards: { reward: { id: string; name: string; icon: string; type: string } }[];
};

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) { }


  async getRanking(page: number = 1, limit: number = 10) {
    const total = await this.prisma.user.count({ where: { isActive: true } });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [users, quizMap, simulatorMap] = await Promise.all([
      this.fetchUsers(),
      this.buildQuizMap(),
      this.buildSimulatorMap(),
    ]);

    const scored = this.scoreAndSort(users, quizMap, simulatorMap);
    const start = (page - 1) * limit;

    return {
      data: scored.slice(start, start + limit).map((u, i) => ({
        ...u,
        position: start + i + 1,
      })),
      meta: { total, page, limit, totalPages },
    };
  }

  async getUserRanking(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: this.userSelect(),
    });
    if (!user) return null;

    const [quizMap, simulatorMap, allUsers] = await Promise.all([
      this.buildQuizMap(),
      this.buildSimulatorMap(),
      this.fetchUsers(),
    ]);

    const scored = this.scoreAndSort(allUsers, quizMap, simulatorMap);
    const position = scored.findIndex(u => u.userId === userId) + 1;
    const entry = scored.find(u => u.userId === userId)!;

    const nonAbandonedGames = simulatorMap.get(userId) ?? 0;
    const rawStats = user.statistics!;

    return {
      ...entry,
      position,
      longestStreak: user.gameStats?.longestStreak ?? 0,
      stats: {
        modulesCompleted: rawStats.modulesCompleted,
        lessonsCompleted: rawStats.lessonsCompleted,
        quizzesCompleted: rawStats.quizzesCompleted,
        quizzesPassed: rawStats.quizzesPassed,
        distinctPassedQuizzes: rawStats.distinctPassedQuizzes,
        approvalRate: rawStats.quizzesCompleted > 0
          ? Math.round((rawStats.quizzesPassed / rawStats.quizzesCompleted) * 100)
          : 0,
        gamesPlayed: nonAbandonedGames,
        gamesWon: rawStats.gamesWon,
        achievementsCount: rawStats.achievementsCount,
        rewardsCount: user._count.rewards,
        totalTransactions: rawStats.totalTransactions,
        xp: user.gameStats?.xp ?? 0,
      },
    };
  }

  async updateRanking(): Promise<{ updated: number }> {
    const count = await this.prisma.user.count({ where: { isActive: true } });
    return { updated: count };
  }


  private userSelect() {
    return {
      id: true,
      createdAt: true,
      profile: { select: { displayName: true, avatarUrl: true } },
      gameStats: true,
      statistics: true,
    _count: { select: { rewards: true } },
    rewards: {
      where: { isEquipped: true },
      select: { reward: { select: { id: true, name: true, icon: true, type: true } } },
    },
  } as const;
  }

  private fetchUsers() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: this.userSelect(),
    });
  }

  private async buildQuizMap(): Promise<Map<string, number>> {
    const aggs = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      _avg: { score: true },
    });
    return new Map(aggs.map(q => [q.userId, q._avg.score ?? 0]));
  }

  private async buildSimulatorMap(): Promise<Map<string, number>> {
    const players = await this.prisma.simulatorPlayer.findMany({
      where: {
        userId: { not: null },
        isBot: false,
        game: { status: { not: SimulatorStatus.ABANDONED } },
      },
      select: { userId: true },
    });

    const map = new Map<string, number>();
    for (const p of players) {
      if (p.userId) map.set(p.userId, (map.get(p.userId) ?? 0) + 1);
    }
    return map;
  }


  private scoreAndSort(
    users: UserSelect[],
    quizMap: Map<string, number>,
    simulatorMap: Map<string, number>,
  ) {
    const scored = users.map(user => {
      const stats = user.statistics!;
      const gameStats = user.gameStats!;
      const result = this.calculateScore(
        stats,
        gameStats,
        quizMap.get(user.id) ?? 0,
        user._count.rewards,
        simulatorMap.get(user.id) ?? 0,
      );

      const findReward = (type: string) =>
        user.rewards.find(r => r.reward.type === type)?.reward ?? null;

      return {
        userId: user.id,
        displayName: user.profile?.displayName ?? 'Usuario',
        avatarUrl: user.profile?.avatarUrl ?? null,
        rank: gameStats.rank,
        level: gameStats.level,
        currentStreak: gameStats.currentStreak,
        registeredAt: user.createdAt,
        score: result.total,
        streakMultiplier: result.multiplier,
        breakdown: result.breakdown,
        equippedBadge: findReward('BADGE'),
        equippedTitle: findReward('TITLE'),
        equippedFrame: findReward('FRAME'),
        equippedAura: findReward('AURA'),
        equippedAvatar: findReward('AVATAR'),
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    stats: {
      totalTransactions: number; modulesCompleted: number; lessonsCompleted: number;
    quizzesCompleted: number; quizzesPassed: number; distinctPassedQuizzes: number;
    gamesWon: number; achievementsCount: number;
    },
    gameStats: { currentStreak: number; xp: number; level: number },
    avgQuizScore: number,
    rewardsCount: number,
    nonAbandonedGames: number,
  ) {
    const modulesScore = cap(stats.modulesCompleted, CAP_MODULES) * 100;
    const lessonsScore = cap(stats.lessonsCompleted, CAP_LESSONS) * 100;
    const approvalRate = stats.quizzesCompleted > 0
      ? stats.quizzesPassed / stats.quizzesCompleted
      : 0;
    const quizScore = avgQuizScore * 0.3 + approvalRate * 100 * 0.7;
    const academicScore = modulesScore * 0.35 + lessonsScore * 0.35 + quizScore * 0.30;

    const gamesScore     = (1 - 1 / (1 + nonAbandonedGames / 15)) * 45;
    const winRate = nonAbandonedGames > 0
      ? Math.min(stats.gamesWon / nonAbandonedGames, 1)
      : 0;
    const simulatorScore = gamesScore + winRate * 55;

    const achTotal = cap(stats.achievementsCount, CAP_ACHIEVEMENTS) * 60
      + cap(rewardsCount, CAP_REWARDS) * 40;

    const activityScore = (1 - 1 / (1 + stats.totalTransactions / 50)) * 100;

    const progressScore = cap(gameStats.level - 1, CAP_LEVEL - 1) * 50
      + cap(gameStats.xp, CAP_XP) * 50;

    const baseScore =
      academicScore * 0.35 +
      simulatorScore * 0.20 +
      achTotal * 0.20 +
      activityScore * 0.15 +
      progressScore * 0.10;

    const multiplier = this.streakMultiplier(gameStats.currentStreak);

    const total = round2(Math.min(baseScore * multiplier, 100));

    return {
      total,
      multiplier: round2(multiplier),
      breakdown: {
        academic: round2(academicScore),
        simulator: round2(simulatorScore),
        achievements: round2(achTotal),
        activity: round2(activityScore),
        progress: round2(progressScore),
      },
    };
  }

  private streakMultiplier(streak: number): number {
    if (streak < 7) return 1.00;
    if (streak < 15) return 1.10;
    if (streak < 31) return 1.20;
    if (streak < 46) return 1.40;
    if (streak < 61) return 1.60;
    if (streak < 91) return 1.80;
    return 2.00;
  }
}

function cap(value: number, max: number): number {
  return Math.min(value / max, 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
