import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';
import type { BoardCell, PlayerProperty } from '@prisma/client';

@Injectable()
export class GameStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  async getGameState(gameId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: {
        players: {
          orderBy: { turnOrder: 'asc' },
          include: { properties: true },
        },
      },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');

    const boardCells = await this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
    const wildcards = await this.prisma.boardWildcard.findMany();

    const currentPlayer = game.players.length > 0
      ? game.players[game.currentPlayerIdx] ?? null
      : null;

    return { game, players: game.players, boardCells, wildcards, currentPlayer };
  }

  async getHistory(userId: string) {
    const games = await this.prisma.simulatorGame.findMany({
      where: { createdByUserId: userId },
      include: { players: { orderBy: { money: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return games.map(g => ({
      id: g.id,
      rounds: g.maxRounds,
      mode: g.mode,
      status: g.status,
      humanPlayerCount: g.players.filter(p => !p.isBot).length,
      winner:
        g.status === 'FINISHED'
          ? (g.players.find(p => !p.isBot && p.finalRank === 1)?.displayName ??
             g.players[0]?.displayName ??
             '-')
          : '-',
      finishedAt: g.finishedAt ?? g.createdAt,
    }));
  }

  async getBoardCells() {
    return this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
  }

  checkLapFinish(game: any): boolean {
    const allPlayers = game.players.filter((p: any) => !p.isEliminated);
    if (allPlayers.length === 0) return true;
    return allPlayers.every((p: any) => (p.lapsCompleted ?? 0) >= game.maxRounds);
  }

  checkGameOver(game: any): boolean {
    const activePlayers = game.players.filter((p: any) => !p.isEliminated);
    if (activePlayers.length <= 1) return true;

    const humansLeft = activePlayers.filter((p: any) => !p.isBot);
    if (humansLeft.length === 0) return true;

    return false;
  }

  async finishGame(gameId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { money: 'desc' } } },
    });
    if (!game) throw new NotFoundException('Partida no encontrada');

    const boardCells = await this.prisma.boardCell.findMany();
    const allProperties = await this.prisma.playerProperty.findMany({ where: { gameId } });

    const ranked = [...game.players].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      return b.money - a.money;
    });

    const recipientId = game.xpRecipientId ?? game.createdByUserId;
    const baseXP = this.getBaseXP(game.maxRounds);

    const humanPlayers = game.players.filter(p => !p.isBot);
    const bestHuman = humanPlayers.length > 0 ? humanPlayers[0] : ranked[0];

    const bestHumanRank =
      ranked.findIndex(p => p.id === bestHuman.id) + 1;

    const positionMultiplier = this.getPositionMultiplier(bestHumanRank);

    const propertiesCount = allProperties.filter(
      p => p.playerId === bestHuman.id
    ).length;

    const completeGroups = this.countCompleteGroups(
      bestHuman.id,
      boardCells,
      allProperties
    );

    const xpAmount = Math.floor(
      baseXP * positionMultiplier +
      propertiesCount * 3 +
      completeGroups * 15
    );

    for (let i = 0; i < ranked.length; i++) {
      await this.prisma.simulatorPlayer.update({
        where: { id: ranked[i].id },
        data: { finalRank: i + 1 },
      });
    }

    if (game.mode === 'SIMULATION') {
      return this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: {
          status: 'FINISHED',
          gamePhase: 'FINISHED',
          finishedAt: new Date(),
        },
      });
    }

    const isWinner = bestHumanRank === 1;

    await this.prisma.userStatistics.upsert({
      where: { userId: recipientId },
      update: {
        gamesPlayed: { increment: 1 },
        gamesWon: isWinner ? { increment: 1 } : undefined,
      },
      create: {
        userId: recipientId,
        gamesPlayed: 1,
        gamesWon: isWinner ? 1 : 0,
      },
    });

    if (xpAmount > 0) {
      try {
        await this.gamification.addXp(recipientId, {
          amount: xpAmount,
          source: XpSource.SIMULATOR_GAME_FINISHED,
          referenceId: gameId,
          description: `Simulador completado — Posición #${bestHumanRank} de ${game.players.length} jugadores`,
        });
      } catch {}
    }
  }

  private getBaseXP(maxRounds: number): number {
    if (maxRounds >= 10) return 175;
    if (maxRounds >= 7) return 120;
    if (maxRounds >= 5) return 80;
    if (maxRounds >= 3) return 50;
    return 25;
  }

  private getPositionMultiplier(position: number): number {
    if (position <= 1) return 2.0;
    if (position === 2) return 1.5;
    if (position === 3) return 1.2;
    return 1.0;
  }

  private countCompleteGroups(
    playerId: string,
    boardCells: BoardCell[],
    allProperties: PlayerProperty[],
  ): number {
    const groups = new Set(boardCells.filter(c => c.group).map(c => c.group));
    let complete = 0;

    for (const group of groups) {
      if (!group) continue;
      const groupCells = boardCells.filter(c => c.group === group);
      if (groupCells.length <= 1) continue;

      const ownedInGroup = allProperties.filter(
        p => p.playerId === playerId && groupCells.some(gc => gc.position === p.cellPosition),
      );

      if (ownedInGroup.length === groupCells.length) {
        complete++;
      }
    }

    return complete;
  }
}
