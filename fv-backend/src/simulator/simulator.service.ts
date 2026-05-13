import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateGameDto } from './dto/create-game.dto';
import { SubmitDecisionDto } from './dto/submit-decision.dto';
import { XpSource } from '@prisma/client';

@Injectable()
export class SimulatorService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async createGame(userId: string, dto: CreateGameDto) {
    if (dto.players.length < 1 || dto.players.length > 4) {
      throw new BadRequestException('Entre 1 y 4 jugadores');
    }

    const game = await this.prisma.simulatorGame.create({
      data: {
        createdByUserId: userId,
        maxRounds: dto.maxRounds,
        roundType: dto.roundType,
        status: 'WAITING',
        players: {
          create: dto.players.map((p) => ({
            displayName: p.displayName,
            userId: p.userId ?? null,
            money: 1000,
            income: 500,
            expenses: 300,
            debt: 0,
            financialScore: 500,
          })),
        },
      },
      include: { players: true },
    });

    return game;
  }

  async startGame(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.createdByUserId !== userId) throw new BadRequestException('Solo el creador puede iniciar');
    if (game.status !== 'WAITING') throw new BadRequestException('La partida ya inició');

    return this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async getGame(gameId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: {
        players: { orderBy: { financialScore: 'desc' } },
        rounds: { orderBy: { roundNumber: 'asc' } },
      },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    return game;
  }

  async getRandomEvent() {
    const events = await this.prisma.simulatorEvent.findMany({
      where: { isActive: true },
      include: { options: true },
    });

    if (events.length === 0) throw new BadRequestException('No hay eventos disponibles');

    const random = events[Math.floor(Math.random() * events.length)];
    return random;
  }

  async submitDecision(gameId: string, dto: SubmitDecisionDto) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: true, rounds: true },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está en curso');

    const player = game.players.find((p) => p.id === dto.playerId);
    if (!player) throw new NotFoundException('Jugador no encontrado');

    const option = await this.prisma.simulatorEventOption.findUnique({
      where: { id: dto.chosenOptionId },
    });
    if (!option) throw new NotFoundException('Opción no encontrada');

    let currentRound = await this.prisma.simulatorRound.findUnique({
      where: {
        gameId_roundNumber: { gameId, roundNumber: game.currentRound },
      },
    });

    if (!currentRound) {
      currentRound = await this.prisma.simulatorRound.create({
        data: { gameId, roundNumber: game.currentRound, startedAt: new Date() },
      });
    }

    const newMoney = Number(player.money) + Number(option.effectMoney);
    const newDebt = Math.max(0, Number(player.debt) + Number(option.effectDebt));
    const newScore = Math.max(0, Math.min(1000, player.financialScore + option.effectScore));

    await this.prisma.simulatorPlayerRound.create({
      data: {
        roundId: currentRound.id,
        playerId: player.id,
        eventId: dto.eventId,
        chosenOptionId: dto.chosenOptionId,
        moneyBefore: player.money,
        moneyAfter: newMoney,
        debtBefore: player.debt,
        debtAfter: newDebt,
        scoreBefore: player.financialScore,
        scoreAfter: newScore,
      },
    });

    await this.prisma.simulatorPlayer.update({
      where: { id: player.id },
      data: {
        money: newMoney,
        debt: newDebt,
        financialScore: newScore,
        isEliminated: newMoney <= 0 && newDebt > 500,
      },
    });

    return {
      explanation: option.explanation,
      moneyBefore: player.money,
      moneyAfter: newMoney,
      debtBefore: player.debt,
      debtAfter: newDebt,
      scoreBefore: player.financialScore,
      scoreAfter: newScore,
    };
  }

  async nextRound(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.createdByUserId !== userId) throw new BadRequestException('Solo el creador puede avanzar ronda');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está en curso');

    await this.prisma.simulatorRound.updateMany({
      where: { gameId, roundNumber: game.currentRound },
      data: { finishedAt: new Date() },
    });

    const newRound = game.currentRound + 1;

    if (newRound > game.maxRounds) {
      return this.finishGame(gameId, userId);
    }

    return this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { currentRound: newRound },
    });
  }

  private async finishGame(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { financialScore: 'desc' } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');

    for (let i = 0; i < game.players.length; i++) {
      await this.prisma.simulatorPlayer.update({
        where: { id: game.players[i].id },
        data: { finalRank: i + 1 },
      });
    }

    await this.prisma.userStatistics.update({
      where: { userId },
      data: { gamesPlayed: { increment: 1 }, gamesWon: { increment: 1 } },
    });

    await this.gamification.addXp(userId, {
      amount: 100,
      source: XpSource.SIMULATOR_ROUND,
      referenceId: gameId,
      description: 'Partida del simulador completada',
    });

    return this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { status: 'FINISHED', finishedAt: new Date() },
      include: { players: { orderBy: { finalRank: 'asc' } } },
    });
  }

  async getGameHistory(userId: string) {
    return this.prisma.simulatorGame.findMany({
      where: { createdByUserId: userId },
      include: { players: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}