import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { GameStateService } from './game-state.service';
import { BotService, BotMoveData } from './bot.service';
import { CreateGameDto } from './dto/create-game.dto';
import { DecideBuyDto } from './dto/decide-buy.dto';
import { DecideOptionDto } from './dto/decide-option.dto';
import { GamePhase } from '@prisma/client';

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
    private readonly gameState: GameStateService,
    private readonly bot: BotService,
  ) {}

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
        userId: userId,
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
        xpRecipientId: userId,
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

    if (game.mode === 'SIMULATION') {
      return this.gameState.getGameState(gameId);
    }

    const result = await this.advanceToHuman(gameId);
    return result.gameState;
  }

  async getGameState(gameId: string, userId?: string) {
    return this.gameState.getGameState(gameId);
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
          gameState: await this.gameState.getGameState(gameId),
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
          const rent = await this.bot.calculateRent(cell, existingProp.playerId, gameId, boardCells, allProperties);
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
            gameState: await this.gameState.getGameState(gameId),
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

      case 'EDUCATIONAL': {
        const amount = cell.amount ?? 50;
        moneyChange = amount;
        currentPlayer.money += amount;
        action = 'EDUCATIONAL';
        actionDetails = { amount, lesson: cell.description };
        break;
      }

      case 'DECISION': {
        const options = await this.prisma.cellDecisionOption.findMany({
          where: { cellPosition: cell.position },
          select: { id: true, text: true },
        });

        currentPlayer.position = newPosition;
        skippedBuy = true;
        action = 'DECISION';
        actionDetails = {
          options,
          cellDescription: cell.description,
        };

        await this.prisma.simulatorPlayer.update({
          where: { id: currentPlayer.id },
          data: { position: newPosition, hasRolled: true },
        });

        await this.prisma.simulatorGame.update({
          where: { id: gameId },
          data: {
            currentDice1: dice1,
            currentDice2: dice2,
            gamePhase: 'DECISION_PENDING',
          },
        });

        return {
          dice1,
          dice2,
          newPosition,
          oldPosition,
          passedGo,
          action: 'DECISION',
          actionDetails,
          gameState: await this.gameState.getGameState(gameId),
        };
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
      gameState: await this.gameState.getGameState(gameId),
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

    return { bought: dto.buy, gameState: await this.gameState.getGameState(gameId) };
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
      gameState: await this.gameState.getGameState(gameId),
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

  async decideOption(gameId: string, userId: string, dto: DecideOptionDto) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no esta activa');
    if (game.gamePhase !== 'DECISION_PENDING') throw new BadRequestException('No hay decision pendiente');

    const player = game.players[game.currentPlayerIdx];
    if (!player) throw new NotFoundException('Jugador no encontrado');
    if (!player.isBot && player.userId !== userId) throw new BadRequestException('No es tu turno');

    const option = await this.prisma.cellDecisionOption.findUnique({
      where: { id: dto.optionId },
    });
    if (!option) throw new NotFoundException('Opcion no encontrada');

    const delta = option.isCorrect ? option.amount : -option.amount;
    player.money += delta;
    if (player.money <= 0) player.isEliminated = true;

    await this.prisma.simulatorPlayer.update({
      where: { id: player.id },
      data: { money: player.money, isEliminated: player.isEliminated },
    });

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { gamePhase: 'BETWEEN_TURNS' },
    });

    return {
      correct: option.isCorrect,
      amount: delta,
      explanation: option.explanation,
      playerMoney: player.money,
      gameState: await this.gameState.getGameState(gameId),
    };
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
    return this.gameState.getHistory(userId);
  }

  async getBoardCells() {
    return this.gameState.getBoardCells();
  }

  async botStep(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.mode !== 'SIMULATION') throw new BadRequestException('Este endpoint es solo para modo observar');
    if (game.createdByUserId !== userId) throw new BadRequestException('Solo el creador puede observar esta partida');
    if (game.status !== 'IN_PROGRESS') {
      return { finished: true, botMove: null, gameState: await this.gameState.getGameState(gameId) };
    }

    if (this.gameState.checkGameOver(game) || this.gameState.checkLapFinish(game)) {
      await this.gameState.finishGame(gameId);
      return { finished: true, botMove: null, gameState: await this.gameState.getGameState(gameId) };
    }

    const currentPlayer = game.players[game.currentPlayerIdx];
    const nextIdx = (game.currentPlayerIdx + 1) % game.players.length;
    const isNewRound = nextIdx <= game.currentPlayerIdx;
    const newRound = isNewRound ? game.currentRound + 1 : game.currentRound;

    if (!currentPlayer || currentPlayer.isEliminated) {
      await this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: { currentPlayerIdx: nextIdx, currentRound: newRound },
      });
      return { finished: false, botMove: null, gameState: await this.gameState.getGameState(gameId) };
    }

    const move = await this.bot.processBotFullTurn(gameId);

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { currentPlayerIdx: nextIdx, currentRound: newRound, gamePhase: 'ROLLING' },
    });

    return { finished: false, botMove: move, gameState: await this.gameState.getGameState(gameId) };
  }

  private async advanceToHuman(gameId: string): Promise<{ gameState: any; botMoves: BotMoveData[] }> {
    const botMoves: BotMoveData[] = [];

    while (true) {
      const game = await this.prisma.simulatorGame.findUnique({
        where: { id: gameId },
        include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
      });

      if (!game || game.status !== 'IN_PROGRESS') break;

      if (this.gameState.checkLapFinish(game)) {
        return { gameState: await this.gameState.finishGame(gameId), botMoves };
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
        const move = await this.bot.processBotFullTurn(gameId);
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

      return { gameState: await this.gameState.getGameState(gameId), botMoves };
    }

    return { gameState: await this.gameState.getGameState(gameId), botMoves };
  }

  private async advanceToNextTurn(gameId: string): Promise<{ gameState: any; botMoves: BotMoveData[] }> {
    const botMoves: BotMoveData[] = [];

    while (true) {
      const game = await this.prisma.simulatorGame.findUnique({
        where: { id: gameId },
        include: { players: { orderBy: { turnOrder: 'asc' }, include: { properties: true } } },
      });

      if (!game || game.status !== 'IN_PROGRESS') {
        return { gameState: await this.gameState.getGameState(gameId), botMoves };
      }

      if (this.gameState.checkGameOver(game)) {
        return { gameState: await this.gameState.finishGame(gameId), botMoves };
      }

      if (this.gameState.checkLapFinish(game)) {
        return { gameState: await this.gameState.finishGame(gameId), botMoves };
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
        const move = await this.bot.processBotFullTurn(gameId);
        if (move) botMoves.push(move);
        continue;
      }

      return { gameState: await this.gameState.getGameState(gameId), botMoves };
    }
  }
}
