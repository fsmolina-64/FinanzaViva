import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateGameDto } from './dto/create-game.dto';
import { SubmitDecisionDto } from './dto/submit-decision.dto';
import { XpSource, BotPersonality } from '@prisma/client';

@Injectable()
export class SimulatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) { }

  // ─────────────────────────── API PÚBLICA ───────────────────────────

  async createGame(userId: string, dto: CreateGameDto) {
    const humanCount = dto.humanPlayers?.length ?? 0;
    const botCount = dto.botPlayers?.length ?? 0;
    const total = humanCount + botCount;

    if (total < 1 || total > 4) {
      throw new BadRequestException('La partida requiere entre 1 y 4 participantes en total');
    }

    // Interleave humanos y bots para que el orden sea variado
    const humanInputs = (dto.humanPlayers ?? []).map((p, i) => ({
      displayName: p.displayName,
      userId: i === 0 ? userId : null,
      isBot: false as const,
      botPersonality: null,
      sortKey: i * 2, // posiciones pares → humanos primero
    }));

    const botInputs = (dto.botPlayers ?? []).map((b, i) => ({
      displayName: b.displayName,
      userId: null,
      isBot: true as const,
      botPersonality: b.personality,
      sortKey: i * 2 + 1, // posiciones impares → bots intercalados
    }));

    const allPlayers = [...humanInputs, ...botInputs]
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((p, i) => ({ ...p, turnOrder: i }));

    const game = await this.prisma.simulatorGame.create({
      data: {
        createdByUserId: userId,
        maxRounds: dto.maxRounds,
        // TODO: verificar el valor correcto del enum RoundType en schema.prisma
        // Si lanza error, busca `enum RoundType {` y reemplaza 'STANDARD' con el primer valor
        roundType: 'MONTHLY',
        mode: dto.mode,
        status: 'WAITING',
        xpRecipientId: dto.xpRecipientId ?? userId,
        players: {
          create: allPlayers.map(p => ({
            displayName: p.displayName,
            userId: p.userId,
            isBot: p.isBot,
            botPersonality: p.botPersonality,
            turnOrder: p.turnOrder,
            // Valores iniciales realistas para un joven profesional
            money: 1500,
            income: 2000,
            expenses: 1200,
            debt: 0,
            savings: 500,
            investments: 0,
            assets: 0,
            financialScore: 600,
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
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    // Asignar primer jugador y avanzar hasta el primer turno humano
    await this.assignEventToPlayer(gameId, game.players[0].id);
    return this.advanceUntilHumanTurn(gameId);
  }

  async getGameState(gameId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: {
        players: {
          orderBy: { turnOrder: 'asc' },
          include: { consequences: true },
        },
      },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');

    // Cargar evento del jugador activo
    let currentEvent: Awaited<ReturnType<typeof this.prisma.simulatorEvent.findUnique>> = null;
    if (game.currentPlayerId) {
      const activePlayer = game.players.find(p => p.id === game.currentPlayerId);
      if (activePlayer?.currentEventId) {
        currentEvent = await this.prisma.simulatorEvent.findUnique({
          where: { id: activePlayer.currentEventId },
          include: { options: true },
        });
      }
    }

    return { ...game, currentEvent };
  }

  async submitDecision(gameId: string, dto: SubmitDecisionDto) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { turnOrder: 'asc' } } },
    });

    if (!game) throw new NotFoundException('Partida no encontrada');
    if (game.status !== 'IN_PROGRESS') throw new BadRequestException('La partida no está activa');
    if (!game.currentPlayerId) throw new BadRequestException('No hay turno activo');

    const activePlayer = await this.prisma.simulatorPlayer.findUnique({
      where: { id: game.currentPlayerId },
      include: { consequences: true },
    });

    if (!activePlayer) throw new NotFoundException('Jugador activo no encontrado');
    if (activePlayer.isBot) throw new BadRequestException('No es el turno de un jugador humano');

    const option = await this.prisma.simulatorEventOption.findUnique({
      where: { id: dto.chosenOptionId },
    });

    if (!option) throw new NotFoundException('Opción no encontrada');
    if (option.eventId !== activePlayer.currentEventId) {
      throw new BadRequestException('La opción no corresponde al evento activo del jugador');
    }

    // Aplicar efectos y registrar
    const result = await this.applyOptionToPlayer(activePlayer, option, gameId, game.currentRound);

    // Avanzar turno (procesando bots automáticamente hasta el siguiente humano)
    const gameState = await this.advanceUntilHumanTurn(gameId);

    return { result, gameState };
  }

  async getRandomEvent() {
    const events = await this.prisma.simulatorEvent.findMany({
      where: { isActive: true },
      include: { options: true },
    });
    if (events.length === 0) throw new BadRequestException('No hay eventos disponibles');
    return events[Math.floor(Math.random() * events.length)];
  }

  async getGameHistory(userId: string) {
    const games = await this.prisma.simulatorGame.findMany({
      where: { createdByUserId: userId, status: 'FINISHED' },
      include: { players: { orderBy: { finalRank: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return games.map(g => ({
      id: g.id,
      rounds: g.maxRounds,
      mode: g.mode,
      playerCount: g.players.length,
      finalBalance: Number(g.players[0]?.money ?? 0),
      score: g.players[0]?.financialScore ?? 0,
      completedAt: g.finishedAt ?? g.createdAt,
    }));
  }

  // ─────────────────────────── TURNO ───────────────────────────────

  /**
   * Loop principal del juego.
   * Avanza turno tras turno hasta que le toca a un humano (o el juego termina).
   * Los bots se resuelven automáticamente en esta misma llamada.
   */
  private async advanceUntilHumanTurn(gameId: string) {
    const MAX_ITERATIONS = 200; // válvula de seguridad para evitar bucles infinitos

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const game = await this.prisma.simulatorGame.findUnique({
        where: { id: gameId },
        include: { players: { orderBy: { turnOrder: 'asc' } } },
      });

      if (!game || game.status !== 'IN_PROGRESS') break;

      const pendingPlayers = game.players.filter(p => !p.hasActed && !p.isEliminated);

      if (pendingPlayers.length === 0) {
        // Todos actuaron → cerrar ronda
        const isGameOver = await this.processEndOfRound(gameId, game);
        if (isGameOver) break;
        continue; // siguiente iteración carga el estado nuevo de la ronda siguiente
      }

      const nextPlayer = pendingPlayers[0];

      // Asignar evento al siguiente jugador y marcarlo como activo
      await this.assignEventToPlayer(gameId, nextPlayer.id);

      if (!nextPlayer.isBot) break; // Turno humano → salir del loop

      // Turno de bot → decidir automáticamente
      await this.processBotTurn(gameId, nextPlayer.id);
      // El loop continúa: el bot ya actuó (hasActed=true), buscará el siguiente
    }

    return this.getGameState(gameId);
  }

  private async assignEventToPlayer(gameId: string, playerId: string) {
    const event = await this.getRandomEvent();

    await Promise.all([
      this.prisma.simulatorPlayer.update({
        where: { id: playerId },
        data: { currentEventId: event.id },
      }),
      this.prisma.simulatorGame.update({
        where: { id: gameId },
        data: { currentPlayerId: playerId },
      }),
    ]);
  }

  // ─────────────────────────── BOTS ────────────────────────────────

  private async processBotTurn(gameId: string, botPlayerId: string) {
    // Cargar datos frescos (el evento fue asignado justo antes)
    const [bot, game] = await Promise.all([
      this.prisma.simulatorPlayer.findUnique({ where: { id: botPlayerId }, include: { consequences: true } }),
      this.prisma.simulatorGame.findUnique({ where: { id: gameId } }),
    ]);

    if (!bot || !bot.currentEventId || !game) return;

    const event = await this.prisma.simulatorEvent.findUnique({
      where: { id: bot.currentEventId },
      include: { options: true },
    });

    if (!event || event.options.length === 0) return;

    const chosen = this.selectBotOption(event.options, bot, bot.botPersonality as BotPersonality | null);
    await this.applyOptionToPlayer(bot, chosen, gameId, game.currentRound);
  }

  private selectBotOption(options: any[], player: any, personality: BotPersonality | null): any {
    if (!personality || options.length === 0) {
      return options[Math.floor(Math.random() * options.length)];
    }

    const currentDebt = Number(player.debt);
    const currentMoney = Number(player.money);

    const scored = options.map(opt => {
      const money = Number(opt.effectMoney ?? 0);
      const debt = Number(opt.effectDebt ?? 0);
      const score = Number(opt.effectScore ?? 0);
      const savings = Number(opt.effectSavings ?? 0);
      const investments = Number(opt.effectInvestments ?? 0);
      const income = Number(opt.effectIncome ?? 0);
      const expenses = Number(opt.effectExpenses ?? 0);

      let weight = 0;

      switch (personality) {
        case 'CONSERVATIVE':
          // Prioriza: evitar deuda, aumentar ahorros, ingresos estables
          weight = money * 1.5 - debt * 3 + savings * 2 + income * 1.5 - expenses * 2 + score * 0.8;
          // Penalizar fuerte si ya tiene deuda
          if (currentDebt > 500 && debt > 0) weight -= 50;
          break;

        case 'RISKY':
          // Prioriza: inversiones y ganancias, ignora deuda moderada
          weight = money * 0.8 + investments * 3 + income * 2 - debt * 0.3 + score * 0.3;
          break;

        case 'IMPULSIVE':
          // Decisiones aleatorias con ligero sesgo hacia ganancias inmediatas
          weight = Math.random() * 100 + money * 0.3;
          break;

        case 'INVESTOR':
          // Prioriza: inversiones y activos, acepta gastos altos si hay retorno
          weight = investments * 4 + savings * 1.5 + income * 2 - debt * 1 + money * 0.4;
          break;

        case 'SAVER':
          // Prioriza: ahorros, reducir gastos, evitar cualquier deuda
          weight = savings * 4 + money * 1.5 - expenses * 3 - debt * 4 + income * 1;
          // Pánico si el dinero está bajo
          if (currentMoney < 500 && savings > 0) weight += savings * 2;
          break;

        default:
          weight = money + score * 0.5;
      }

      return { opt, weight };
    });

    return scored.sort((a, b) => b.weight - a.weight)[0].opt;
  }

  // ─────────────────────────── RONDAS ──────────────────────────────

  private async processEndOfRound(gameId: string, game: any): Promise<boolean> {
    // Cerrar el registro de la ronda
    await this.prisma.simulatorRound.updateMany({
      where: { gameId, roundNumber: game.currentRound },
      data: { finishedAt: new Date() },
    });

    // Aplicar ciclo de ingresos/gastos y consecuencias a todos los jugadores activos
    const players = await this.prisma.simulatorPlayer.findMany({
      where: { gameId, isEliminated: false },
      include: { consequences: true },
    });

    for (const player of players) {
      let moneyDelta = 0;
      let incomeDelta = 0;
      let expensesDelta = 0;
      let scoreDelta = 0;

      // Procesar consecuencias persistentes
      for (const consequence of player.consequences) {
        if (consequence.roundsRemaining <= 0) continue;
        moneyDelta += Number(consequence.effectMoney);
        incomeDelta += Number(consequence.effectIncome);
        expensesDelta += Number(consequence.effectExpenses);
        scoreDelta += consequence.effectScore;

        if (consequence.roundsRemaining === 1) {
          await this.prisma.simulatorConsequence.delete({ where: { id: consequence.id } });
        } else {
          await this.prisma.simulatorConsequence.update({
            where: { id: consequence.id },
            data: { roundsRemaining: consequence.roundsRemaining - 1 },
          });
        }
      }

      // Ciclo mensual: ingresos - gastos + efectos de consecuencias
      const monthlyNet =
        (Number(player.income) + incomeDelta) -
        (Number(player.expenses) + expensesDelta);

      const newMoney = Number(player.money) + monthlyNet + moneyDelta;
      const newScore = Math.max(0, Math.min(1000, player.financialScore + scoreDelta));

      await this.prisma.simulatorPlayer.update({
        where: { id: player.id },
        data: {
          money: newMoney,
          financialScore: newScore,
          hasActed: false,      // reset para la siguiente ronda
          currentEventId: null,
        },
      });
    }

    const nextRound = game.currentRound + 1;

    // ¿Fue la última ronda?
    if (nextRound > game.maxRounds) {
      await this.finishGame(gameId, game.createdByUserId);
      return true; // juego terminado
    }

    await this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { currentRound: nextRound, currentPlayerId: null },
    });

    return false; // continuar
  }

  // ─────────────────────────── OPCIÓN A JUGADOR ───────────────────

  private async applyOptionToPlayer(player: any, option: any, gameId: string, roundNumber: number) {
    const moneyBefore = Number(player.money);
    const debtBefore = Number(player.debt);
    const scoreBefore = player.financialScore;
    const savingsBefore = Number(player.savings ?? 0);
    const investmentsBefore = Number(player.investments ?? 0);

    const moneyAfter = moneyBefore + Number(option.effectMoney ?? 0);
    const debtAfter = Math.max(0, debtBefore + Number(option.effectDebt ?? 0));
    const scoreAfter = Math.max(0, Math.min(1000, scoreBefore + Number(option.effectScore ?? 0)));
    const savingsAfter = Math.max(0, savingsBefore + Number(option.effectSavings ?? 0));
    const investmentsAfter = Math.max(0, investmentsBefore + Number(option.effectInvestments ?? 0));
    const assetsAfter = Math.max(0, Number(player.assets ?? 0) + Number(option.effectAssets ?? 0));
    // income y expenses cambian permanentemente (representan cambios laborales/contractuales)
    const incomeAfter = Math.max(0, Number(player.income) + Number(option.effectIncome ?? 0));
    const expensesAfter = Math.max(0, Number(player.expenses) + Number(option.effectExpenses ?? 0));

    // Asegurar que existe el registro de ronda
    let round = await this.prisma.simulatorRound.findUnique({
      where: { gameId_roundNumber: { gameId, roundNumber } },
    });
    if (!round) {
      round = await this.prisma.simulatorRound.create({
        data: { gameId, roundNumber, startedAt: new Date() },
      });
    }

    // Registrar la acción del jugador
    await this.prisma.simulatorPlayerRound.create({
      data: {
        roundId: round.id,
        playerId: player.id,
        eventId: option.eventId,
        chosenOptionId: option.id,
        moneyBefore,
        moneyAfter,
        debtBefore,
        debtAfter,
        scoreBefore,
        scoreAfter,
      },
    });

    // Crear consecuencia persistente si la opción la genera
    const consequenceRounds = Number(option.consequenceRounds ?? 0);
    if (consequenceRounds > 0 && option.consequenceDesc) {
      await this.prisma.simulatorConsequence.create({
        data: {
          playerId: player.id,
          description: option.consequenceDesc,
          effectMoney: Number(option.effectMoney ?? 0),
          effectIncome: Number(option.effectIncome ?? 0),
          effectExpenses: Number(option.effectExpenses ?? 0),
          effectScore: Number(option.effectScore ?? 0),
          roundsRemaining: consequenceRounds,
          sourceEventId: option.eventId,
        },
      });
    }

    // Actualizar estado del jugador
    await this.prisma.simulatorPlayer.update({
      where: { id: player.id },
      data: {
        money: moneyAfter,
        debt: debtAfter,
        financialScore: scoreAfter,
        savings: savingsAfter,
        investments: investmentsAfter,
        assets: assetsAfter,
        income: incomeAfter,
        expenses: expensesAfter,
        hasActed: true,
        currentEventId: null,
        isEliminated: moneyAfter <= -500 && debtAfter > 1000,
      },
    });

    return {
      explanation: option.explanation,
      moneyBefore,
      moneyAfter,
      moneyChange: moneyAfter - moneyBefore,
      debtBefore,
      debtAfter,
      debtChange: debtAfter - debtBefore,
      scoreBefore,
      scoreAfter,
      scoreChange: scoreAfter - scoreBefore,
      savingsBefore,
      savingsAfter,
      investmentsBefore,
      investmentsAfter,
      incomeAfter,
      expensesAfter,
      hasConsequence: consequenceRounds > 0,
      consequenceDesc: option.consequenceDesc ?? null,
      consequenceRounds,
    };
  }

  // ─────────────────────────── FINAL ───────────────────────────────

  private async finishGame(gameId: string, userId: string) {
    const game = await this.prisma.simulatorGame.findUnique({
      where: { id: gameId },
      include: { players: { orderBy: { financialScore: 'desc' } } },
    });
    if (!game) return;

    // Rankear todos los jugadores por score financiero
    for (let i = 0; i < game.players.length; i++) {
      await this.prisma.simulatorPlayer.update({
        where: { id: game.players[i].id },
        data: { finalRank: i + 1 },
      });
    }

    // XP al recipiente designado, basada en el mejor jugador humano
    const recipientId = (game as any).xpRecipientId ?? userId;
    const humanPlayers = game.players.filter((p: any) => !p.isBot);
    const bestHuman = humanPlayers[0] ?? game.players[0];
    const xpAmount = this.calculateXP(bestHuman, game.maxRounds);

    await this.prisma.userStatistics.update({
      where: { userId: recipientId },
      data: { gamesPlayed: { increment: 1 }, gamesWon: { increment: 1 } },
    });

    await this.gamification.addXp(recipientId, {
      amount: xpAmount,
      source: XpSource.SIMULATOR_ROUND,
      referenceId: gameId,
      description: `Simulador completado — Score financiero ${bestHuman.financialScore}`,
    });

    return this.prisma.simulatorGame.update({
      where: { id: gameId },
      data: { status: 'FINISHED', finishedAt: new Date() },
    });
  }

  private calculateXP(player: any, maxRounds: number): number {
    const score = player.financialScore as number;
    const money = Number(player.money);
    const debt = Number(player.debt);
    const savings = Number(player.savings ?? 0);
    const investments = Number(player.investments ?? 0);

    const netWorth = money + savings + investments - debt;

    const scoreXP = Math.floor((score / 1000) * 100);                          // 0–100 pts
    const netWorthXP = Math.max(0, Math.min(50, Math.floor(netWorth / 100)));  // 0–50 pts
    const roundsBonus = maxRounds * 5;                                          // 15–50 pts
    const debtPenalty = debt > 3000 ? 30 : debt > 1500 ? 15 : 0;              // 0–30 pts

    return Math.max(10, scoreXP + netWorthXP + roundsBonus - debtPenalty);
  }
}