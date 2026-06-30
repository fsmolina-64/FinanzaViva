import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { BoardCell, PlayerProperty } from '@prisma/client';

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

@Injectable()
export class BotService {
  constructor(private readonly prisma: PrismaService) {}

  async processBotFullTurn(gameId: string): Promise<BotMoveData | null> {
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

      case 'EDUCATIONAL': {
        const amount = cell.amount ?? 50;
        player.money += amount;
        action = 'COLLECT';
        actionDetail = `${player.displayName} aprendio sobre finanzas: +$${amount}`;
        break;
      }

      case 'DECISION': {
        const options = await this.prisma.cellDecisionOption.findMany({
          where: { cellPosition: cell.position },
        });

        if (options.length >= 2) {
          const personality = player.botPersonality ?? 'CONSERVATIVE';
          const correctChance: Record<string, number> = {
            CONSERVATIVE: 0.80,
            INVESTOR:     0.80,
            SAVER:        0.75,
            RISKY:        0.45,
            IMPULSIVE:    0.40,
          };
          const pickCorrect = Math.random() < (correctChance[personality] ?? 0.60);
          const chosen = options.find(o => o.isCorrect === pickCorrect)
            ?? options[0];
          const delta = chosen.isCorrect ? chosen.amount : -chosen.amount;
          player.money += delta;
          if (player.money <= 0) player.isEliminated = true;
          action = 'DECISION';
          actionDetail = `${player.displayName} ${chosen.isCorrect ? 'tomo buena decision' : 'tomo mala decision'}: ${chosen.text.slice(0, 40)}`;
        }
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

    await this.saveMultiPlayerMoney(game, allProperties, gameId);

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

  applyBotWildcard(
    bot: any,
    game: any,
    wildcard: { type: string; effectAmount: number },
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

  botDecideBuy(
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

  async calculateRent(
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

  async saveMultiPlayerMoney(game: any, properties: PlayerProperty[], gameId: string) {
    for (const p of game.players) {
      if (p.isBot || p.userId) {
        await this.prisma.simulatorPlayer.update({
          where: { id: p.id },
          data: { money: p.money, isEliminated: p.isEliminated },
        });
      }
    }
  }
}
