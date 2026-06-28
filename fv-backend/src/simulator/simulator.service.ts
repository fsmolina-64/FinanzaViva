import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateGameDto } from './dto/create-game.dto';
import { DecideBuyDto } from './dto/decide-buy.dto';
import { XpSource, WildcardType, SimulatorStatus, GamePhase } from '@prisma/client';
import { SimulatorPlayer, SimulatorGame, PlayerProperty, BoardCell, BoardWildcard } from '@prisma/client';

export interface BotMoveData {
  playerName: string;
  dice1: number;
  dice2: number;
  diceSum: number;
  fromPosition: number;
  toPosition: number;
  passedGo: boolean;
  action: string;
  actionDetail: string;
}

const WILDCARD_TYPE_CODE: Record<string, number> = {
  POSITIVE: 0,
  NEGATIVE: 1,
  GO_TO_JAIL: 2,
  COLLECT_FROM_ALL: 3,
  PAY_TO_ALL: 4,
};

const WILDCARD_CODE_TO_TYPE: Record<number, string> = {
  0: 'POSITIVE',
  1: 'NEGATIVE',
  2: 'GO_TO_JAIL',
  3: 'COLLECT_FROM_ALL',
  4: 'PAY_TO_ALL',
};

@Injectable()
export class SimulatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) { }

  async createGame(userId: string, dto: CreateGameDto) {
    const humanCount = dto.humanPlayers?.length ?? 0;
    const botCount = dto.botPlayers?.length ?? 0;
    const total = humanCount + botCount;

    if (total < 2 || total > 8) {
      throw new BadRequestException('La partida requiere entre 2 y 8 participantes en total');
    }

    const initialMoney = dto.initialMoney ?? 1500;

    const entries: Array<{
      displayName: string;
      userId: string | null;
      isBot: boolean;
      botPersonality: any;
      tokenSymbol: string;
      shuffle: number;
    }> = [];

    for (const p of dto.humanPlayers ?? []) {
      entries.push({
        displayName: p.displayName,
        userId: p.userId ?? userId,
        isBot: false,
        botPersonality: null,
        tokenSymbol: p.tokenSymbol ?? '★',
        shuffle: Math.random(),
      });
    }

    for (const b of dto.botPlayers ?? []) {
      entries.push({
        displayName: b.displayName,
        userId: null,
        isBot: true,
        botPersonality: b.personality,
        tokenSymbol: b.tokenSymbol ?? '★',
        shuffle: Math.random(),
      });
    }

    entries.sort((a, b) => a.shuffle - b.shuffle);

    const game = await this.prisma.simulatorGame.create({
      data: {
        createdByUserId: userId,
        maxRounds: dto.maxRounds,
        mode: dto.mode,
        status: 'WAITING',
        gamePhase: 'WAITING',
        initialMoney,
        xpRecipientId: dto.xpRecipientId ?? userId,
        players: {
          create: entries.map((e, i) => ({
            displayName: e.displayName,
            userId: e.userId,
            isBot: e.isBot,
            botPersonality: e.botPersonality,
            tokenSymbol: e.tokenSymbol,
            turnOrder: i,
            money: initialMoney,
            position: 0,
            isInJail: false,
            jailTurnsLeft: 0,
            hasRolled: false,
          })),
        },
      },
      include: { players: { orderBy: { turnOrder: 'asc' } } },
    });

    return game;
  }

  async startGame(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.createdByUserId !== userId) throw new BadRequestException('Solo el creador puede iniciar');
    if (game.status !== 'WAITING') throw new BadRequestException('La partida ya comenzó');

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: {
        status: 'IN_PROGRESS',
        gamePhase: 'ROLLING',
        currentRound: 1,
        startedAt: new Date(),
        currentPlayerIdx: 0,
      },
    });

    const result = await this.advanceToHuman(gameId);
    return result.gameState;
  }

  async getGameState(gameId: string, userId?: string) {
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

  async rollDice(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está activa');
    if (game.gamePhase !== 'ROLLING') throw new BadRequestException('No es momento de lanzar dados');

    const currentPlayer = game.players[game.currentPlayerIdx];
    if (!currentPlayer) throw new NotFoundException('Jugador actual no encontrado');
    if (!currentPlayer.isBot && currentPlayer.userId !== userId) {
      throw new BadRequestException('No es tu turno');
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;

    if (currentPlayer.isInJail) {
      currentPlayer.jailTurnsLeft--;
      if (dice1 === dice2 || currentPlayer.jailTurnsLeft <= 0) {
        currentPlayer.isInJail = false;
        currentPlayer.jailTurnsLeft = 0;
      } else {
        await this.prisma.simulatorGame.update({
          where: { id: gameId },
          data: { currentDice1: dice1, currentDice2: dice2, gamePhase: 'BETWEEN_TURNS' },
        });
        await this.prisma.simulatorPlayer.update({
          where: { id: currentPlayer.id },
          data: { hasRolled: true, jailTurnsLeft: currentPlayer.jailTurnsLeft },
        });
        return {
          dice1,
          dice2,
          newPosition: currentPlayer.position,
          action: 'STAY_IN_JAIL',
          actionDetails: { jailTurnsLeft: currentPlayer.jailTurnsLeft },
          gameState: await this.getGameState(gameId, userId),
        };
      }
    }

    const sum = dice1 + dice2;
    const oldPosition = currentPlayer.position;
    const rawNewPos = oldPosition + sum;
    const passedGo = rawNewPos >= 40;
    const newPosition = rawNewPos % 40;

    if (passedGo) {
      await this.prisma.simulatorPlayer.update({
        where: { id: currentPlayer.id },
        data: { lapsCompleted: { increment: 1 } },
      });
    }

    const boardCells = await this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
    const cell = boardCells.find(c => c.position === newPosition);
    if (!cell) throw new NotFoundException(`Casilla ${newPosition} no encontrada en el tablero`);

    const allProperties = await this.prisma.playerProperty.findMany({ where: { gameId } });
    let action: string = 'NOTHING';
    let actionDetails: any = {};
    let moneyChange = 0;
    let skippedBuy = false;

    switch (cell.type) {
      case 'INICIO': {
        action = 'NOTHING';
        break;
      }

      case 'PROPERTY': {
        const existingProp = allProperties.find(p => p.cellPosition === cell.position);
        if (!existingProp) {
          currentPlayer.position = newPosition;
          action = 'BUY';
          skippedBuy = true;
        } else if (existingProp.playerId === currentPlayer.id) {
          action = 'NOTHING';
        } else {
          const owner = game.players.find(p => p.id === existingProp.playerId);
          const rent = await this.calculateRent(cell, existingProp.playerId, gameId, boardCells, allProperties);
          moneyChange = -rent;
          currentPlayer.money -= rent;
          if (owner) {
            owner.money += rent;
            await this.prisma.simulatorPlayer.update({
              where: { id: owner.id },
              data: { money: owner.money },
            });
          }
          action = 'PAY_RENT';
          actionDetails = { rent, ownerId: existingProp.playerId, ownerName: owner?.displayName };
        }
        break;
      }

      case 'TAX': {
        const amount = cell.amount ?? 0;
        moneyChange = -amount;
        currentPlayer.money -= amount;
        action = 'PAY_TAX';
        actionDetails = { amount };
        break;
      }

      case 'LOTTERY': {
        const amount = cell.amount ?? 0;
        moneyChange = amount;
        currentPlayer.money += amount;
        action = 'LOTTERY';
        actionDetails = { amount };
        break;
      }

      case 'PENSION':
      case 'PENSION_ESPECIAL': {
        const amount = cell.amount ?? 0;
        moneyChange = amount;
        currentPlayer.money += amount;
        action = 'PENSION';
        actionDetails = { amount, pensionType: cell.type };
        break;
      }

      case 'WILDCARD': {
        const wildcards = await this.prisma.boardWildcard.findMany();
        if (wildcards.length === 0) {
          action = 'NOTHING';
        } else {
          const wildcard = wildcards[Math.floor(Math.random() * wildcards.length)];
          action = 'WILDCARD';
          skippedBuy = true;
          actionDetails = {
            wildcardId: wildcard.id,
            text: wildcard.text,
            type: wildcard.type,
            effectAmount: wildcard.effectAmount,
            explanation: wildcard.explanation,
          };

          await this.prisma.simulatorGame.update({
            where: { id: gameId },
            data: {
              currentDice1: wildcard.effectAmount,
              currentDice2: WILDCARD_TYPE_CODE[wildcard.type] ?? 0,
              gamePhase: 'WILDCARD_REVEAL',
            },
          });

          await this.prisma.simulatorPlayer.update({
            where: { id: currentPlayer.id },
            data: { position: newPosition, hasRolled: true },
          });

          return {
            dice1,
            dice2,
            newPosition,
            oldPosition,
            passedGo: newPosition < oldPosition,
            action: 'WILDCARD',
            actionDetails,
            gameState: await this.getGameState(gameId, userId),
          };
        }
        break;
      }

      case 'SCAM': {
        const amount = cell.amount ?? 0;
        moneyChange = -amount;
        currentPlayer.money -= amount;
        action = 'SCAM';
        actionDetails = { amount };
        break;
      }

      case 'GO_TO_JAIL': {
        currentPlayer.position = 10;
        currentPlayer.isInJail = true;
        currentPlayer.jailTurnsLeft = 1;
        action = 'GO_TO_JAIL';
        actionDetails = { jailPosition: 10 };
        break;
      }

      case 'JAIL': {
        action = 'NOTHING';
        break;
      }
    }

    if (!skippedBuy) {
      if (currentPlayer.money <= 0) {
        currentPlayer.isEliminated = true;
      }
      currentPlayer.position = newPosition;
    }

    if (action !== 'WILDCARD') {
      await this.prisma.simulatorPlayer.update({
        where: { id: currentPlayer.id },
        data: {
          position: currentPlayer.position,
          money: currentPlayer.money,
          isEliminated: currentPlayer.isEliminated,
          isInJail: currentPlayer.isInJail,
          jailTurnsLeft: currentPlayer.jailTurnsLeft,
          hasRolled: true,
        },
      });

      if (actionDetails.ownerId) {
        const owner = game.players.find(p => p.id === actionDetails.ownerId);
        if (owner) {
          await this.prisma.simulatorPlayer.update({
            where: { id: owner.id },
            data: { money: owner.money },
          });
        }
      }

      const nextPhase: GamePhase = action === 'BUY' ? 'BUYING' : 'BETWEEN_TURNS';
      await this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: {
          currentDice1: dice1,
          currentDice2: dice2,
          gamePhase: nextPhase,
        },
      });
    }

    return {
      dice1,
      dice2,
      newPosition: currentPlayer.position,
      oldPosition,
      passedGo,
      action,
      actionDetails,
      gameState: await this.getGameState(gameId, userId),
    };
  }

  async decideBuy(gameId: string, userId: string, dto: DecideBuyDto) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está activa');
    if (game.gamePhase !== 'BUYING') throw new BadRequestException('No es momento de comprar');

    const player = game.players[game.currentPlayerIdx];
    if (!player) throw new NotFoundException('Jugador actual no encontrado');
    if (!player.isBot && player.userId !== userId) {
      throw new BadRequestException('No es tu turno');
    }

    const boardCells = await this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
    const cell = boardCells.find(c => c.position === player.position);
    if (!cell || cell.type !== 'PROPERTY') {
      throw new BadRequestException('No hay propiedad disponible para comprar en esta casilla');
    }

    const existingProp = await this.prisma.playerProperty.findUnique({
      where: { gameId_cellPosition: { gameId, cellPosition: cell.position } },
    });
    if (existingProp) {
      throw new BadRequestException('Esta propiedad ya tiene dueño');
    }

    if (dto.buy) {
      const price = cell.price ?? 0;
      if (player.money < price) {
        throw new BadRequestException('No tienes suficiente dinero');
      }

      await this.prisma.playerProperty.create({
        data: {
          gameId,
          playerId: player.id,
          cellPosition: cell.position,
        },
      });

      player.money -= price;
      await this.prisma.simulatorPlayer.update({
        where: { id: player.id },
        data: { money: player.money },
      });
    }

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { gamePhase: 'BETWEEN_TURNS' },
    });

    return { bought: dto.buy, gameState: await this.getGameState(gameId, userId) };
  }

  async dismissWildcard(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está activa');
    if (game.gamePhase !== 'WILDCARD_REVEAL') throw new BadRequestException('No hay carta de wildcard pendiente');

    const player = game.players[game.currentPlayerIdx];
    if (!player) throw new NotFoundException('Jugador actual no encontrado');
    if (!player.isBot && player.userId !== userId) {
      throw new BadRequestException('No es tu turno');
    }

    const effectAmount = game.currentDice1 ?? 0;
    const typeCode = game.currentDice2 ?? 0;
    const wildcardType = WILDCARD_CODE_TO_TYPE[typeCode] ?? 'POSITIVE';

    let moneyChange = 0;

    switch (wildcardType) {
      case 'GO_TO_JAIL': {
        player.position = 10;
        player.isInJail = true;
        player.jailTurnsLeft = 1;
        break;
      }

      case 'COLLECT_FROM_ALL': {
        const others = game.players.filter(p => p.id !== player.id && !p.isEliminated);
        for (const other of others) {
          other.money -= effectAmount;
          if (other.money <= 0) other.isEliminated = true;
          await this.prisma.simulatorPlayer.update({
            where: { id: other.id },
            data: { money: other.money, isEliminated: other.isEliminated },
          });
        }
        player.money += effectAmount * others.length;
        moneyChange = effectAmount * others.length;
        break;
      }

      case 'PAY_TO_ALL': {
        const others = game.players.filter(p => p.id !== player.id && !p.isEliminated);
        const totalCost = effectAmount * others.length;
        player.money -= totalCost;
        moneyChange = -totalCost;
        if (player.money <= 0) player.isEliminated = true;
        for (const other of others) {
          other.money += effectAmount;
          await this.prisma.simulatorPlayer.update({
            where: { id: other.id },
            data: { money: other.money },
          });
        }
        break;
      }

      case 'POSITIVE': {
        player.money += effectAmount;
        moneyChange = effectAmount;
        break;
      }

      case 'NEGATIVE': {
        player.money -= effectAmount;
        moneyChange = -effectAmount;
        if (player.money <= 0) player.isEliminated = true;
        break;
      }
    }

    await this.prisma.simulatorPlayer.update({
      where: { id: player.id },
      data: {
        money: player.money,
        position: player.position,
        isInJail: player.isInJail,
        jailTurnsLeft: player.jailTurnsLeft,
        isEliminated: player.isEliminated,
      },
    });

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: {
        gamePhase: 'BETWEEN_TURNS',
        currentDice1: null,
        currentDice2: null,
      },
    });

    return {
      wildcardType,
      effectAmount,
      moneyChange,
      isInJail: player.isInJail,
      gameState: await this.getGameState(gameId, userId),
    };
  }

  async endTurn(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está activa');
    if (game.gamePhase !== 'BETWEEN_TURNS') throw new BadRequestException('No es momento de terminar turno');

    const currentPlayer = game.players[game.currentPlayerIdx];
    if (!currentPlayer) throw new NotFoundException('Jugador actual no encontrado');
    if (currentPlayer.userId !== userId) {
      throw new BadRequestException('No es tu turno');
    }

    const result = await this.advanceToNextTurn(gameId);
    return { gameState: result.gameState, botMoves: result.botMoves };
  }

  async abandonGame(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');

    if (game.status === 'FINISHED' || game.status === 'ABANDONED') {
      return { success: true, status: game.status };
    }

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: {
        status: 'ABANDONED',
        gamePhase: 'ABANDONED',
        abandonedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    if (game.mode !== 'SIMULATION') {
      await this.prisma.userStatistics
        .update({
          where: { userId },
          data: { gamesPlayed: { increment: 1 } },
        })
        .catch(() => {});
    }

    return { success: true, status: 'ABANDONED' };
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
      humanPlayerCount: g.players.filter((p: any) => !p.isBot).length,
      winner:
        g.status === 'FINISHED'
          ? (g.players.find((p: any) => !p.isBot && p.finalRank === 1)?.displayName ??
             g.players[0]?.displayName ??
             '-')
          : '-',
      finishedAt: g.finishedAt ?? g.createdAt,
    }));
  }

  async getBoardCells() {
    return this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
  }



  private async advanceToHuman(gameId: string): Promise<{ gameState: any; botMoves: BotMoveData[] }> {
    const botMoves: BotMoveData[] = [];

    while (true) {
      const game = await this.prisma.simulatorGame.findUnique({
        where: { id: gameId },
        include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
      });

      if (!game || game.status !== 'IN_PROGRESS') break;

      if (this.checkLapFinish(game)) {
        return { gameState: await this.finishGame(gameId), botMoves };
      }

      const currentPlayer = game.players[game.currentPlayerIdx];

      if (currentPlayer.isEliminated) {
        const nextIdx = (game.currentPlayerIdx + 1) % game.players.length;
        await this.prisma.simulatorGame.update({
          where: { id: gameId },
          data: { currentPlayerIdx: nextIdx },
        });
        continue;
      }

      if (currentPlayer.isBot) {
        const move = await this.processBotFullTurn(gameId);
        if (move) botMoves.push(move);
        const nextIdx = (game.currentPlayerIdx + 1) % game.players.length;
        await this.prisma.simulatorGame.update({
          where: { id: gameId },
          data: { currentPlayerIdx: nextIdx, gamePhase: 'ROLLING' },
        });
        continue;
      }

      await this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: { gamePhase: 'ROLLING' },
      });

      return { gameState: await this.getGameState(gameId), botMoves };
    }

    return { gameState: await this.getGameState(gameId), botMoves };
  }

  private async advanceToNextTurn(gameId: string): Promise<{ gameState: any; botMoves: BotMoveData[] }> {
    const botMoves: BotMoveData[] = [];

    while (true) {
      const game = await this.prisma.simulatorGame.findUnique({
        where: { id: gameId },
        include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
      });

      if (!game || game.status !== 'IN_PROGRESS') {
        return { gameState: await this.getGameState(gameId), botMoves };
      }

      if (this.checkGameOver(game)) {
        return { gameState: await this.finishGame(gameId), botMoves };
      }

      if (this.checkLapFinish(game)) {
        return { gameState: await this.finishGame(gameId), botMoves };
      }

      const nextIdx = (game.currentPlayerIdx + 1) % game.players.length;
      const isNewRound = nextIdx <= game.currentPlayerIdx;
      const newRound = isNewRound ? game.currentRound + 1 : game.currentRound;

      const nextPlayer = game.players[nextIdx];
      if (nextPlayer.isEliminated) {
        await this.prisma.simulatorGame.update({
          where: { id: gameId },
          data: { currentPlayerIdx: nextIdx, currentRound: newRound },
        });
        continue;
      }

      if (isNewRound) {
        await this.prisma.simulatorPlayer.updateMany({
          where: { gameId },
          data: { hasRolled: false },
        });
      }
      nextPlayer.hasRolled = false;

      await this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: {
          currentPlayerIdx: nextIdx,
          currentRound: newRound,
          gamePhase: 'ROLLING',
          currentDice1: null,
          currentDice2: null,
        },
      });

      if (nextPlayer.isBot) {
        const move = await this.processBotFullTurn(gameId);
        if (move) botMoves.push(move);
        continue;
      }

      return { gameState: await this.getGameState(gameId), botMoves };
    }
  }

  private async processBotFullTurn(gameId: string): Promise<BotMoveData | null> {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game || game.status !== 'IN_PROGRESS') return null;

    const player = game.players[game.currentPlayerIdx];
    if (!player || !player.isBot) return null;

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const sum = dice1 + dice2;
    const oldPosition = player.position;
    const rawNewPos = oldPosition + sum;
    const passedGo = rawNewPos >= 40;
    let newPosition = rawNewPos % 40;

    if (player.isInJail) {
      player.jailTurnsLeft--;
      if (dice1 === dice2 || player.jailTurnsLeft <= 0) {
        player.isInJail = false;
        player.jailTurnsLeft = 0;
      } else {
        await this.prisma.simulatorPlayer.update({
          where: { id: player.id },
          data: { jailTurnsLeft: player.jailTurnsLeft, hasRolled: true },
        });
        return null;
      }
    }

    if (passedGo) {
      await this.prisma.simulatorPlayer.update({
        where: { id: player.id },
        data: { lapsCompleted: { increment: 1 } },
      });
    }

    const boardCells = await this.prisma.boardCell.findMany({ orderBy: { position: 'asc' } });
    const cell = boardCells.find(c => c.position === newPosition);
    if (!cell) return null;

    const allProperties = await this.prisma.playerProperty.findMany({ where: { gameId } });

    let purchased = false;
    let action = 'NOTHING';
    let actionDetail = '';

    switch (cell.type) {
      case 'PROPERTY': {
        const existingProp = allProperties.find(p => p.cellPosition === cell.position);
        if (!existingProp) {
          const botDecision = this.botDecideBuy(player, cell, allProperties, boardCells);
          if (botDecision) {
            const price = cell.price ?? 0;
            if (player.money >= price) {
              await this.prisma.playerProperty.create({
                data: { gameId, playerId: player.id, cellPosition: cell.position },
              });
              player.money -= price;
              purchased = true;
              action = 'BUY';
              actionDetail = `${player.displayName} compro ${cell.name}`;
            }
          }
        } else if (existingProp.playerId !== player.id) {
          const rent = await this.calculateRent(cell, existingProp.playerId, gameId, boardCells, allProperties);
          player.money -= rent;
          if (player.money <= 0) player.isEliminated = true;
          const owner = game.players.find(p => p.id === existingProp.playerId);
          if (owner) {
            owner.money += rent;
            await this.prisma.simulatorPlayer.update({
              where: { id: owner.id },
              data: { money: owner.money },
            });
          }
          action = 'PAY_RENT';
          actionDetail = `Pago $${rent} de renta a ${owner?.displayName ?? '?'}`;
        }
        break;
      }

      case 'TAX':
      case 'SCAM': {
        const amount = cell.amount ?? 0;
        player.money -= amount;
        if (player.money <= 0) player.isEliminated = true;
        action = cell.type === 'TAX' ? 'PAY_TAX' : 'SCAM';
        actionDetail = `Pago $${amount} en ${cell.name}`;
        break;
      }

      case 'LOTTERY':
      case 'PENSION':
      case 'PENSION_ESPECIAL': {
        const amount = cell.amount ?? 0;
        player.money += amount;
        action = 'COLLECT';
        actionDetail = `Recibio $${amount} de ${cell.name}`;
        break;
      }

      case 'WILDCARD': {
        const wildcards = await this.prisma.boardWildcard.findMany();
        if (wildcards.length > 0) {
          const wildcard = wildcards[Math.floor(Math.random() * wildcards.length)];
          this.applyBotWildcard(player, game, wildcard);
          action = 'WILDCARD';
          actionDetail = `Carta: ${wildcard.text}`;
        }
        break;
      }

      case 'GO_TO_JAIL': {
        newPosition = 10;
        player.isInJail = true;
        player.jailTurnsLeft = 1;
        action = 'GO_TO_JAIL';
        actionDetail = `${player.displayName} fue a la carcel`;
        break;
      }
    }

    player.position = newPosition;
    if (!purchased && player.money <= 0) {
      player.isEliminated = true;
    }

    await this.prisma.simulatorPlayer.update({
      where: { id: player.id },
      data: {
        position: player.position,
        money: player.money,
        isEliminated: player.isEliminated,
        isInJail: player.isInJail,
        jailTurnsLeft: player.jailTurnsLeft,
        hasRolled: true,
      },
    });

    this.saveMultiPlayerMoney(game, allProperties, gameId);

    return {
      playerName: player.displayName,
      dice1,
      dice2,
      diceSum: sum,
      fromPosition: oldPosition,
      toPosition: newPosition,
      passedGo,
      action,
      actionDetail,
    };
  }

  private applyBotWildcard(
    bot: any,
    game: any,
    wildcard: BoardWildcard,
  ) {
    const amount = wildcard.effectAmount;

    switch (wildcard.type) {
      case 'GO_TO_JAIL': {
        bot.position = 10;
        bot.isInJail = true;
        bot.jailTurnsLeft = 1;
        break;
      }

      case 'COLLECT_FROM_ALL': {
        const others = game.players.filter((p: any) => p.id !== bot.id && !p.isEliminated);
        for (const other of others) {
          other.money -= amount;
          if (other.money <= 0) other.isEliminated = true;
        }
        bot.money += amount * others.length;
        break;
      }

      case 'PAY_TO_ALL': {
        const others = game.players.filter((p: any) => p.id !== bot.id && !p.isEliminated);
        bot.money -= amount * others.length;
        if (bot.money <= 0) bot.isEliminated = true;
        for (const other of others) {
          other.money += amount;
        }
        break;
      }

      case 'POSITIVE': {
        bot.money += amount;
        break;
      }

      case 'NEGATIVE': {
        bot.money -= amount;
        if (bot.money <= 0) bot.isEliminated = true;
        break;
      }
    }
  }

  private async saveMultiPlayerMoney(game: any, properties: PlayerProperty[], gameId: string) {
    for (const p of game.players) {
      if (p.isBot || p.userId) {
        await this.prisma.simulatorPlayer.update({
          where: { id: p.id },
          data: { money: p.money, isEliminated: p.isEliminated },
        });
      }
    }
  }

  private botDecideBuy(
    player: any,
    cell: BoardCell,
    ownedProperties: PlayerProperty[],
    boardCells: BoardCell[],
  ): boolean {
    const cash = player.money;
    const price = cell.price ?? 0;
    if (price <= 0) return false;

    const personality = player.botPersonality ?? 'CONSERVATIVE';
    const playerProps = ownedProperties.filter(p => p.playerId === player.id);
    const owned = playerProps.length;

    switch (personality) {
      case 'CONSERVATIVE':
        return price <= 150 && cash - price >= 400;

      case 'RISKY':
        return price <= 350 && cash >= price;

      case 'IMPULSIVE':
        return cash >= price && Math.random() < 0.7;

      case 'INVESTOR': {
        const groupCells = boardCells.filter(c => c.group === cell.group);
        const groupTotal = groupCells.length;
        const groupOwned = playerProps.filter(pp => {
          const c = boardCells.find(bc => bc.position === pp.cellPosition);
          return c && c.group === cell.group;
        }).length;
        const completesGroup = groupOwned === groupTotal - 1 && groupTotal > 1;
        return cash >= price && (completesGroup || Math.random() < 0.5);
      }

      case 'SAVER':
        return cash >= price * 2 && Math.random() < 0.2;

      default:
        return cash >= price && Math.random() < 0.5;
    }
  }

  private async calculateRent(
    cell: BoardCell,
    ownerId: string,
    gameId: string,
    boardCells: BoardCell[],
    allProperties: PlayerProperty[],
  ): Promise<number> {
    const baseRent = cell.rent ?? 0;
    if (!cell.group) return baseRent;

    const groupCells = boardCells.filter(c => c.group === cell.group);
    const ownedInGroup = allProperties.filter(
      p => p.playerId === ownerId && groupCells.some(gc => gc.position === p.cellPosition),
    );

    if (ownedInGroup.length === groupCells.length && groupCells.length > 1) {
      return baseRent * 2;
    }

    return baseRent;
  }

  private checkLapFinish(game: any): boolean {
    const allPlayers = game.players.filter((p: any) => !p.isEliminated);
    if (allPlayers.length === 0) return true;
    return allPlayers.every((p: any) => (p.lapsCompleted ?? 0) >= game.maxRounds);
  }

  private checkGameOver(game: any): boolean {
    const activePlayers = game.players.filter((p: any) => !p.isEliminated);
    if (activePlayers.length <= 1) return true;

    const humansLeft = activePlayers.filter((p: any) => !p.isBot);
    if (humansLeft.length === 0) return true;

    return false;
  }

  private async finishGame(gameId: string) {
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

    const humanPlayers = game.players.filter((p: any) => !p.isBot);
    const bestHuman = humanPlayers.length > 0 ? humanPlayers[0] : ranked[0];

    const bestHumanRank =
      ranked.findIndex((p: any) => p.id === bestHuman.id) + 1;

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
