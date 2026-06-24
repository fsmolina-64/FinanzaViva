import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimulatorStatus } from '@prisma/client';

// ─── Normalisation caps ────────────────────────────────────────────────────────
const CAP_TRANSACTIONS = 200;
const CAP_MODULES = 7;
const CAP_LESSONS = 28;
const CAP_GAMES = 30;
const CAP_ACHIEVEMENTS = 30;
const CAP_REWARDS = 20;
const CAP_XP = 10_000;
const CAP_LEVEL = 20;

type UserSelect = {
  id: string;
  createdAt: Date;
  profile: { displayName: string; avatarUrl: string | null } | null;
  gameStats: { rank: string; level: number; xp: number; currentStreak: number; longestStreak: number } | null;
  statistics: {
    totalTransactions: number; modulesCompleted: number; lessonsCompleted: number;
    quizzesCompleted: number; quizzesPassed: number; gamesWon: number; achievementsCount: number;
  } | null;
  _count: { rewards: number };
};

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) { }

  // ─── Public API ───────────────────────────────────────────────────────────────

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

    // Stats extra para el perfil detallado
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
    // TODO: agregar capa de caché (Redis) cuando escale
    return { updated: count };
  }

  // ─── Queries auxiliares ───────────────────────────────────────────────────────

  private userSelect() {
    return {
      id: true,
      createdAt: true,
      profile: { select: { displayName: true, avatarUrl: true } },
      gameStats: true,
      statistics: true,
      _count: { select: { rewards: true } },
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

  // ─── Scoring ──────────────────────────────────────────────────────────────────

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
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private calculateScore(
    stats: {
      totalTransactions: number; modulesCompleted: number; lessonsCompleted: number;
      quizzesCompleted: number; quizzesPassed: number; gamesWon: number; achievementsCount: number;
    },
    gameStats: { currentStreak: number; xp: number; level: number },
    avgQuizScore: number,
    rewardsCount: number,
    nonAbandonedGames: number,
  ) {
    // ── A) Académico 35% ──────────────────────────────────────────────────────
    const modulesScore = cap(stats.modulesCompleted, CAP_MODULES) * 100;
    const lessonsScore = cap(stats.lessonsCompleted, CAP_LESSONS) * 100;
    const approvalRate = stats.quizzesCompleted > 0
      ? stats.quizzesPassed / stats.quizzesCompleted
      : 0;
    const quizScore = avgQuizScore * 0.5 + approvalRate * 100 * 0.5;
    const academicScore = modulesScore * 0.35 + lessonsScore * 0.35 + quizScore * 0.30;

    // ── B) Simulador 20% (sin ABANDONED) ─────────────────────────────────────
    const gamesScore = cap(nonAbandonedGames, CAP_GAMES) * 60;
    const winRate = nonAbandonedGames > 0
      ? Math.min(stats.gamesWon / nonAbandonedGames, 1)
      : 0;
    const simulatorScore = gamesScore + winRate * 40;

    // ── C) Logros + recompensas 20% ───────────────────────────────────────────
    const achTotal = cap(stats.achievementsCount, CAP_ACHIEVEMENTS) * 60
      + cap(rewardsCount, CAP_REWARDS) * 40;

    // ── D) Actividad 15% ──────────────────────────────────────────────────────
    const activityScore = cap(stats.totalTransactions, CAP_TRANSACTIONS) * 100;

    // ── E) Progreso (nivel + XP) 10% ─────────────────────────────────────────
    const progressScore = cap(gameStats.level - 1, CAP_LEVEL - 1) * 50
      + cap(gameStats.xp, CAP_XP) * 50;

    // ── Base 0-100 ────────────────────────────────────────────────────────────
    const baseScore =
      academicScore * 0.35 +
      simulatorScore * 0.20 +
      achTotal * 0.20 +
      activityScore * 0.15 +
      progressScore * 0.10;

    // ── Multiplicador de racha ────────────────────────────────────────────────
    const multiplier = this.streakMultiplier(gameStats.currentStreak);

    // ── Total, clamped 0-100 ──────────────────────────────────────────────────
    const total = round2(Math.min(baseScore * multiplier, 100));

    return {
      total,
      multiplier: round2(multiplier),
      breakdown: {
        academic: Math.round(academicScore),
        simulator: Math.round(simulatorScore),
        achievements: Math.round(achTotal),
        activity: Math.round(activityScore),
        progress: Math.round(progressScore),
      },
    };
  }

  private streakMultiplier(streak: number): number {
    if (streak === 0) return 0.40;
    if (streak === 1) return 0.50;
    if (streak === 2) return 0.60;
    if (streak <= 6) return 0.65 + (streak - 3) * 0.067;
    if (streak === 7) return 1.30;
    if (streak <= 14) return 1.30 + (streak - 7) * 0.050;
    if (streak <= 30) return 1.65 + (streak - 14) * 0.022;
    return Math.min(2.00 + (streak - 30) * 0.005, 2.50);
  }
}

// ─── Helpers puros ────────────────────────────────────────────────────────────
function cap(value: number, max: number): number {
  return Math.min(value / max, 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
