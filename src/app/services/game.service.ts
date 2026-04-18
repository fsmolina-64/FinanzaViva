import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { FinanzasService } from './finanzas.service';
import { ProfileService } from './profile.service';

export type SquareType = 'start' | 'property' | 'event' | 'tax' | 'bonus' | 'free' | 'jail' | 'chance';
export type FinancialProfile = 'ahorrista' | 'inversor' | 'gastador' | 'equilibrado';

export interface BoardSquare {
  id: number;
  type: SquareType;
  name: string;
  description: string;
  icon: string;
  color: string;
  price?: number;
  rent?: number;
  value?: number;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  color: string;
  coins: number;
  position: number;
  ownedSquares: number[];
  isActive: boolean;
  inJail: boolean;
  jailTurns: number;
}

export interface GameEvent {
  message: string;
  positive: boolean;
  amount?: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  owned: number;
  history: number[];
}

export interface GameTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  icon: string;
  date: Date;
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
}

export interface PowerCard {
  id: string;
  type: 'tablero' | 'mercado' | 'seguridad';
  name: string;
  description: string;
  color: string;
  uses: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  requirements: string;
  salary: number;
  minLevel: number;
  icon: string;
  active: boolean;
}

export interface RankingPlayer {
  rank: number;
  name: string;
  avatar: string;
  coins: number;
  level: number;
  xp: number;
  profile: FinancialProfile;
}

export const BOARD_SQUARES: BoardSquare[] = [
  { id: 0, type: 'start', name: 'SALIDA', description: 'Cobra $500 cada vuelta', icon: '🏁', color: '#10B981', value: 500 },
  { id: 1, type: 'property', name: 'Cafetería', description: 'Pequeño negocio rentable', icon: '☕', color: '#F59E0B', price: 200, rent: 50 },
  { id: 2, type: 'chance', name: 'Suerte', description: 'Evento aleatorio de fortuna', icon: '🃏', color: '#8B5CF6' },
  { id: 3, type: 'property', name: 'Tienda de Ropa', description: 'Boutique de moda local', icon: '👗', color: '#EC4899', price: 300, rent: 80 },
  { id: 4, type: 'tax', name: 'Impuesto IVA', description: 'El fisco cobra su parte', icon: '🏛️', color: '#EF4444', value: -120 },
  { id: 5, type: 'property', name: 'Librería', description: 'Conocimiento = negocio', icon: '📚', color: '#F59E0B', price: 350, rent: 90 },
  { id: 6, type: 'event', name: 'Bono Laboral', description: 'Tu empresa reconoce tu trabajo', icon: '💼', color: '#10B981', value: 300 },
  { id: 7, type: 'property', name: 'Restaurante', description: 'Gastronomía = alta demanda', icon: '🍽️', color: '#F97316', price: 450, rent: 120 },
  { id: 8, type: 'property', name: 'Departamento A', description: 'Propiedad en zona céntrica', icon: '🏢', color: '#6366F1', price: 550, rent: 150 },
  { id: 9, type: 'event', name: '¡Inflación!', description: 'Los precios suben, pierdes poder', icon: '📈', color: '#EF4444', value: -150 },
  { id: 10, type: 'property', name: 'Clínica Dental', description: 'Servicio esencial siempre rentable', icon: '🦷', color: '#06B6D4', price: 600, rent: 160 },
  { id: 11, type: 'chance', name: 'Suerte', description: 'Evento aleatorio de fortuna', icon: '🃏', color: '#8B5CF6' },
  { id: 12, type: 'jail', name: '¡A la Cárcel!', description: 'Pierde un turno', icon: '🔒', color: '#374151' },
  { id: 13, type: 'property', name: 'Gimnasio', description: 'Salud y bienestar en auge', icon: '🏋️', color: '#10B981', price: 650, rent: 170 },
  { id: 14, type: 'bonus', name: 'Dividendos', description: 'Tus inversiones dan frutos', icon: '💰', color: '#F59E0B', value: 250 },
  { id: 15, type: 'property', name: 'Farmacia', description: 'Esencial en toda comunidad', icon: '💊', color: '#EC4899', price: 700, rent: 190 },
  { id: 16, type: 'event', name: 'Crisis Global', description: 'Mercados caen por conflicto', icon: '🌍', color: '#EF4444', value: -200 },
  { id: 17, type: 'property', name: 'Casa Residencial', description: 'Vivienda en zona exclusiva', icon: '🏠', color: '#8B5CF6', price: 800, rent: 220 },
  { id: 18, type: 'chance', name: 'Suerte', description: 'Evento aleatorio de fortuna', icon: '🃏', color: '#8B5CF6' },
  { id: 19, type: 'property', name: 'Hotel Boutique', description: 'Turismo = ingresos fijos', icon: '🏨', color: '#F97316', price: 900, rent: 250 },
  { id: 20, type: 'free', name: 'Parque', description: 'Descansa sin efectos', icon: '🌳', color: '#10B981' },
  { id: 21, type: 'property', name: 'Oficina Corporativa', description: 'Sede de una gran empresa', icon: '🏗️', color: '#6366F1', price: 1000, rent: 280 },
  { id: 22, type: 'bonus', name: 'Premio Lotería', description: '¡El destino te sonríe!', icon: '🎉', color: '#F59E0B', value: 600 },
  { id: 23, type: 'property', name: 'Centro Comercial', description: 'El rey de los negocios', icon: '🛍️', color: '#EC4899', price: 1200, rent: 350 },
];

export const TOTAL_SQUARES = BOARD_SQUARES.length;

export const CHANCE_EVENTS: { message: string; value: number }[] = [
  { message: '¡Ganas el concurso de innovación! +$400', value: 400 },
  { message: 'Multa de tránsito inesperada. -$150', value: -150 },
  { message: 'Bono de referido activo. +$200', value: 200 },
  { message: 'Reparación urgente del carro. -$250', value: -250 },
  { message: '¡Tu startup recibe inversión! +$700', value: 700 },
  { message: 'Emergencia médica sin seguro. -$350', value: -350 },
  { message: 'Tu contenido en redes va viral. +$300', value: 300 },
  { message: 'Caída del mercado cripto. -$180', value: -180 },
  { message: '¡Premio del banco por fidelidad! +$250', value: 250 },
  { message: 'Fuga de agua en tu casa. -$120', value: -120 },
  { message: 'Cliente VIP paga de más. +$450', value: 450 },
  { message: 'Hackeo a tu cuenta digital. -$200', value: -200 },
];

export const PLAYER_PRESETS = [
  { color: '#10B981', emoji: '🚀' },
  { color: '#8B5CF6', emoji: '🎯' },
  { color: '#F59E0B', emoji: '⚡' },
];

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'TEC', name: 'TechNova', price: 42, change: 1.4, changePercent: 3.45, owned: 0, history: [36, 37, 38, 39, 41, 40, 42] },
  { symbol: 'ECO', name: 'EcoGrid', price: 31, change: -0.8, changePercent: -2.52, owned: 0, history: [34, 33, 32, 31, 30, 31, 31] },
  { symbol: 'SAL', name: 'SaludPlus', price: 55, change: 2.1, changePercent: 3.97, owned: 0, history: [46, 48, 49, 51, 53, 54, 55] },
  { symbol: 'FIN', name: 'FinCapital', price: 27, change: 0.5, changePercent: 1.89, owned: 0, history: [25, 25.5, 26, 26.5, 26.2, 26.8, 27] },
];

const INITIAL_JOBS: Job[] = [
  { id: 'asistente', title: 'Asistente Junior', company: 'FinanzaViva Lab', requirements: 'Primeros pasos en presupuestos y organización.', salary: 650, minLevel: 1, icon: '🗂️', active: true },
  { id: 'analista', title: 'Analista Financiero', company: 'Capital Andes', requirements: 'Saber leer métricas y comparar inversiones.', salary: 1100, minLevel: 3, icon: '📊', active: false },
  { id: 'trader', title: 'Trader Digital', company: 'Mercado Ágil', requirements: 'Buen manejo de riesgo y volatilidad.', salary: 1650, minLevel: 5, icon: '💹', active: false },
  { id: 'cfo', title: 'Director Financiero', company: 'Grupo Aurora', requirements: 'Visión estratégica y liderazgo.', salary: 2400, minLevel: 7, icon: '🏦', active: false },
];

const INITIAL_POWER_CARDS: PowerCard[] = [
  { id: 'bonus-coins', type: 'mercado', name: 'Impulso de Liquidez', description: 'Recibes un bono inmediato de efectivo para aprovechar oportunidades.', color: '#10B981', uses: 2 },
  { id: 'debt-shield', type: 'seguridad', name: 'Escudo Antideuda', description: 'Reduce una parte de tu deuda activa.', color: '#F59E0B', uses: 1 },
  { id: 'xp-burst', type: 'tablero', name: 'Modo Experto', description: 'Obtienes XP extra por tu avance financiero.', color: '#6366F1', uses: 2 },
];

const ACHIEVEMENT_CATALOG: Omit<GameAchievement, 'unlocked'>[] = [
  { id: 'first_login', title: 'Primer Paso', description: 'Iniciaste sesión por primera vez.', icon: '👣', xpReward: 20 },
  { id: 'first_quiz', title: 'Estudiante', description: 'Completaste tu primer quiz de la academia.', icon: '📖', xpReward: 40 },
  { id: 'first_mov', title: 'Contable', description: 'Registraste tu primer movimiento financiero.', icon: '📊', xpReward: 30 },
  { id: 'board_lap', title: 'Una Vuelta', description: 'Diste una vuelta completa en el tablero.', icon: '🎲', xpReward: 35 },
  { id: 'level_3', title: 'Nivel 3', description: 'Llegaste al nivel 3.', icon: '⭐', xpReward: 60 },
  { id: 'rich', title: 'Acaudalado', description: 'Superaste las 5,000 monedas.', icon: '💰', xpReward: 80 },
];

function cloneStocks(): Stock[] {
  return INITIAL_STOCKS.map(stock => ({ ...stock, history: [...stock.history] }));
}

function cloneJobs(): Job[] {
  return INITIAL_JOBS.map(job => ({ ...job }));
}

function clonePowerCards(): PowerCard[] {
  return INITIAL_POWER_CARDS.map(card => ({ ...card }));
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private auth = inject(AuthService);
  private finanzas = inject(FinanzasService);
  private profileSvc = inject(ProfileService);

  readonly squares = BOARD_SQUARES;
  readonly totalSquares = TOTAL_SQUARES;

  players = signal<Player[]>([]);
  activePlayerIdx = signal(0);
  diceResult = signal<[number, number]>([1, 1]);
  isRolling = signal(false);
  isMoving = signal(false);
  movingPlayerIdx = signal(-1);
  pendingEvent = signal<GameEvent | null>(null);
  pendingBuy = signal<{ squareId: number; price: number; name: string } | null>(null);
  gameStarted = signal(false);
  turnCount = signal(0);

  stocks = signal<Stock[]>(cloneStocks());
  debt = signal(0);
  jobs = signal<Job[]>(cloneJobs());
  powerCards = signal<PowerCard[]>(clonePowerCards());
  private sessionTransactions = signal<GameTransaction[]>([]);

  coins = computed(() => this.profileSvc.profile()?.coins ?? 0);
  xp = computed(() => this.profileSvc.profile()?.xp ?? 0);
  level = computed(() => this.profileSvc.profile()?.level ?? 1);
  correctAnswers = computed(() => this.profileSvc.profile()?.quizzesCompleted ?? 0);
  playerName = computed(() => {
    const profile = this.profileSvc.profile();
    return profile?.name?.trim() || this.activePlayer?.name || this.auth.session()?.name || 'Jugador';
  });
  playerAvatar = computed(() => this.profileSvc.profile()?.avatar ?? this.activePlayer?.avatar ?? '🦊');
  xpProgress = computed(() => this.profileSvc.xpProgress);
  boardPosition = computed(() => this.players()[0]?.position ?? 0);
  totalPortfolioValue = computed(() =>
    this.stocks().reduce((sum, stock) => sum + stock.price * stock.owned, 0)
  );
  netWorth = computed(() => this.coins() + this.totalPortfolioValue() - this.debt());
  achievements = computed<GameAchievement[]>(() => {
    const unlocked = new Set(this.profileSvc.profile()?.achievementsUnlocked ?? []);
    return ACHIEVEMENT_CATALOG.map(achievement => ({
      ...achievement,
      unlocked: unlocked.has(achievement.id),
    }));
  });
  unlockedAchievements = computed(() =>
    this.achievements().filter(achievement => achievement.unlocked).length
  );
  transactions = computed<GameTransaction[]>(() => {
    const mappedFinanzas: GameTransaction[] = this.finanzas.movimientos().map(mov => ({
      id: `mov-${mov.id}`,
      description: mov.concepto,
      amount: mov.monto,
      type: mov.tipo === 'ingreso' ? 'income' : 'expense',
      icon: mov.tipo === 'ingreso' ? '💵' : '💳',
      date: new Date(mov.createdAt),
    }));

    return [...this.sessionTransactions(), ...mappedFinanzas]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  });
  activeJob = computed(() => this.jobs().find(job => job.active) ?? null);
  financialProfile = computed<FinancialProfile>(() => {
    const coins = this.coins();
    const portfolio = this.totalPortfolioValue();
    const debt = this.debt();
    if (debt > Math.max(800, coins * 0.8)) return 'gastador';
    if (portfolio > coins * 0.7) return 'inversor';
    if (coins >= 3000 && debt === 0) return 'ahorrista';
    return 'equilibrado';
  });
  rankingPlayers = computed<RankingPlayer[]>(() => {
    const myCoins = this.coins();
    const myLevel = this.level();
    const myXp = this.xp();

    return [
      { rank: 0, name: 'Sofía Mercado', avatar: '🦉', coins: Math.max(myCoins + 1800, 5200), level: Math.max(myLevel + 2, 6), xp: Math.max(myXp + 500, 1500), profile: 'inversor' },
      { rank: 0, name: 'Diego Ahorro', avatar: '🐯', coins: Math.max(myCoins + 700, 3600), level: Math.max(myLevel + 1, 4), xp: Math.max(myXp + 180, 900), profile: 'ahorrista' },
      { rank: 0, name: 'Valentina Balance', avatar: '🦊', coins: Math.max(1200, myCoins - 350), level: Math.max(2, myLevel), xp: Math.max(250, myXp - 90), profile: 'equilibrado' },
      { rank: 0, name: 'Leo Riesgo', avatar: '🦁', coins: Math.max(800, myCoins - 900), level: Math.max(1, myLevel - 1), xp: Math.max(160, myXp - 220), profile: 'gastador' },
    ];
  });
  playerRank = computed(() => {
    const me: RankingPlayer = {
      rank: 0,
      name: `${this.playerName()} (Tú)`,
      avatar: this.playerAvatar(),
      coins: this.coins(),
      level: this.level(),
      xp: this.xp(),
      profile: this.financialProfile(),
    };

    const all = [...this.rankingPlayers(), me]
      .sort((a, b) => b.coins - a.coins)
      .map((player, index) => ({ ...player, rank: index + 1 }));

    return all.find(player => player.name.endsWith('(Tú)'))?.rank ?? 1;
  });

  constructor() {
    effect(
      () => {
        const session = this.auth.session();
        if (!session) {
          this.resetEconomicState();
          return;
        }

        this.profileSvc.loadForCurrentUser();
        this.finanzas.loadForCurrentUser();
        this.resetEconomicState();
      },
      { allowSignalWrites: true }
    );
  }

  get activePlayer(): Player | undefined {
    return this.players()[this.activePlayerIdx()];
  }

  initGame(playerNames: string[], playerAvatars: string[]) {
    const ps: Player[] = playerNames.map((name, i) => ({
      id: i,
      name,
      avatar: playerAvatars[i] ?? PLAYER_PRESETS[i].emoji,
      color: PLAYER_PRESETS[i].color,
      coins: 1500,
      position: 0,
      ownedSquares: [],
      isActive: i === 0,
      inJail: false,
      jailTurns: 0,
    }));

    this.players.set(ps);
    this.activePlayerIdx.set(0);
    this.turnCount.set(0);
    this.gameStarted.set(true);
    this.pendingEvent.set(null);
    this.pendingBuy.set(null);
  }

  async rollAndMove(): Promise<void> {
    if (this.isRolling() || this.isMoving()) return;

    this.isRolling.set(true);
    let ticks = 0;
    await new Promise<void>(resolve => {
      const iv = setInterval(() => {
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        this.diceResult.set([r1, r2]);
        ticks++;
        if (ticks >= 12) {
          clearInterval(iv);
          resolve();
        }
      }, 80);
    });
    this.isRolling.set(false);

    const [d1, d2] = this.diceResult();
    const steps = d1 + d2;
    const pIdx = this.activePlayerIdx();

    this.isMoving.set(true);
    this.movingPlayerIdx.set(pIdx);

    let currentPos = this.players()[pIdx].position;
    for (let s = 0; s < steps; s++) {
      await new Promise(resolve => setTimeout(resolve, 340));
      currentPos = (currentPos + 1) % TOTAL_SQUARES;
      if (currentPos === 0 && s > 0) {
        this.updatePlayerCoins(pIdx, 500);
        this.profileSvc.unlockAchievement('board_lap');
      }
      this.updatePlayerPos(pIdx, currentPos);
    }

    this.isMoving.set(false);
    this.movingPlayerIdx.set(-1);
    this.turnCount.update(turn => turn + 1);

    await new Promise(resolve => setTimeout(resolve, 200));
    this.applySquareEffect(pIdx, currentPos);
  }

  simulateMarket() {
    this.stocks.update(stocks =>
      stocks.map(stock => {
        const oldPrice = stock.price;
        const factor = 1 + (Math.random() * 0.12 - 0.06);
        const newPrice = Math.max(8, Math.round(oldPrice * factor * 100) / 100);
        const change = Math.round((newPrice - oldPrice) * 100) / 100;
        const changePercent = Math.round((change / oldPrice) * 10000) / 100;

        return {
          ...stock,
          price: newPrice,
          change,
          changePercent,
          history: [...stock.history, newPrice].slice(-10),
        };
      })
    );
  }

  buyStock(symbol: string, qty: number): boolean {
    const safeQty = Math.max(1, Math.floor(qty));
    const stock = this.stocks().find(item => item.symbol === symbol);
    if (!stock) return false;

    const cost = Math.round(stock.price * safeQty);
    if (!this.profileSvc.removeCoins(cost)) return false;

    this.stocks.update(stocks =>
      stocks.map(item =>
        item.symbol === symbol ? { ...item, owned: item.owned + safeQty } : item
      )
    );
    this.profileSvc.addXP(12);
    this.recordTransaction(`Compra de ${safeQty} ${symbol}`, cost, 'investment', '📈');
    return true;
  }

  sellStock(symbol: string, qty: number): boolean {
    const safeQty = Math.max(1, Math.floor(qty));
    const stock = this.stocks().find(item => item.symbol === symbol);
    if (!stock || stock.owned < safeQty) return false;

    const income = Math.round(stock.price * safeQty);
    this.stocks.update(stocks =>
      stocks.map(item =>
        item.symbol === symbol ? { ...item, owned: item.owned - safeQty } : item
      )
    );
    this.profileSvc.addCoins(income);
    this.profileSvc.addXP(8);
    this.recordTransaction(`Venta de ${safeQty} ${symbol}`, income, 'income', '💹');
    return true;
  }

  setJob(jobId: string): boolean {
    const job = this.jobs().find(item => item.id === jobId);
    if (!job || this.level() < job.minLevel) return false;

    this.jobs.update(jobs =>
      jobs.map(item => ({ ...item, active: item.id === jobId }))
    );
    this.recordTransaction(`Nuevo empleo: ${job.title}`, job.salary, 'income', '💼');
    return true;
  }

  collectSalary(): number {
    const job = this.activeJob();
    if (!job) return 0;

    this.profileSvc.addCoins(job.salary);
    this.profileSvc.addXP(15);
    this.recordTransaction(`Salario de ${job.title}`, job.salary, 'income', '💵');
    return job.salary;
  }

  removeCoins(amount: number): boolean {
    const ok = this.profileSvc.removeCoins(amount);
    if (ok) {
      this.recordTransaction('Pago de emergencia', amount, 'expense', '🧾');
    }
    return ok;
  }

  addDebt(amount: number) {
    if (amount <= 0) return;
    this.debt.update(debt => debt + amount);
    this.recordTransaction('Aumento de deuda', amount, 'expense', '⚠️');
  }

  reduceDebt(amount: number) {
    if (amount <= 0) return;
    this.debt.update(debt => Math.max(0, debt - amount));
  }

  usePowerCard(cardId: string): boolean {
    const card = this.powerCards().find(item => item.id === cardId);
    if (!card || card.uses <= 0) return false;

    this.powerCards.update(cards =>
      cards.map(item =>
        item.id === cardId ? { ...item, uses: item.uses - 1 } : item
      )
    );

    if (cardId === 'bonus-coins') {
      this.profileSvc.addCoins(300);
      this.recordTransaction('Carta: Impulso de Liquidez', 300, 'income', '🃏');
    } else if (cardId === 'debt-shield') {
      this.reduceDebt(250);
      this.recordTransaction('Carta: Escudo Antideuda', 250, 'income', '🛡️');
    } else if (cardId === 'xp-burst') {
      this.profileSvc.addXP(90);
    }

    return true;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  buyCurrentSquare() {
    const buy = this.pendingBuy();
    if (!buy) return;
    const pIdx = this.activePlayerIdx();
    this.updatePlayerCoins(pIdx, -buy.price);
    this.players.update(players =>
      players.map((player, index) =>
        index === pIdx ? { ...player, ownedSquares: [...player.ownedSquares, buy.squareId] } : player
      )
    );
    this.pendingBuy.set(null);
    this.pendingEvent.set({ message: `✅ ¡Compraste ${buy.name} por $${buy.price}!`, positive: true });
  }

  skipBuy() {
    this.pendingBuy.set(null);
    this.nextTurn();
  }

  clearEvent() {
    this.pendingEvent.set(null);
    this.nextTurn();
  }

  nextTurn() {
    const players = this.players();
    if (players.length === 0) return;

    let next = (this.activePlayerIdx() + 1) % players.length;
    let attempts = 0;
    while (players[next].inJail && attempts < players.length) {
      this.players.update(current =>
        current.map((player, index) => {
          if (index !== next) return player;
          const jailTurns = player.jailTurns - 1;
          return { ...player, jailTurns, inJail: jailTurns > 0 };
        })
      );
      next = (next + 1) % players.length;
      attempts++;
    }

    this.activePlayerIdx.set(next);
    this.players.update(current =>
      current.map((player, index) => ({ ...player, isActive: index === next }))
    );
  }

  getPropertyOwner(squareId: number): number | null {
    const players = this.players();
    for (let i = 0; i < players.length; i++) {
      if (players[i].ownedSquares.includes(squareId)) return i;
    }
    return null;
  }

  getSquare(id: number): BoardSquare {
    return BOARD_SQUARES[id];
  }

  isPlayerHere(squareId: number, playerIdx: number): boolean {
    return this.players()[playerIdx]?.position === squareId;
  }

  getPlayersAtSquare(squareId: number): Player[] {
    return this.players().filter(player => player.position === squareId);
  }

  resetGame() {
    this.gameStarted.set(false);
    this.players.set([]);
    this.pendingEvent.set(null);
    this.pendingBuy.set(null);
    this.turnCount.set(0);
  }

  private resetEconomicState() {
    this.stocks.set(cloneStocks());
    this.debt.set(0);
    this.jobs.set(cloneJobs());
    this.powerCards.set(clonePowerCards());
    this.sessionTransactions.set([]);
  }

  private recordTransaction(
    description: string,
    amount: number,
    type: GameTransaction['type'],
    icon: string
  ) {
    const tx: GameTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description,
      amount,
      type,
      icon,
      date: new Date(),
    };

    this.sessionTransactions.update(transactions => [tx, ...transactions].slice(0, 20));
  }

  private applySquareEffect(pIdx: number, pos: number) {
    const sq = BOARD_SQUARES[pos];
    const player = this.players()[pIdx];

    switch (sq.type) {
      case 'start':
        this.updatePlayerCoins(pIdx, sq.value ?? 0);
        this.pendingEvent.set({ message: '🏁 Vuelta completa: ¡+$500!', positive: true, amount: 500 });
        break;

      case 'property': {
        const ownedBy = this.getPropertyOwner(sq.id);
        if (ownedBy === null) {
          if (player.coins >= (sq.price ?? 0)) {
            this.pendingBuy.set({ squareId: sq.id, price: sq.price ?? 0, name: sq.name });
          } else {
            this.pendingEvent.set({ message: `${sq.icon} Sin fondos para comprar ${sq.name} ($${sq.price})`, positive: false });
          }
        } else if (ownedBy === pIdx) {
          this.pendingEvent.set({ message: `${sq.icon} Esta propiedad ya te pertenece 😎`, positive: true });
        } else {
          const rent = sq.rent ?? 0;
          const ownerPlayer = this.players()[ownedBy];
          if (player.coins >= rent) {
            this.updatePlayerCoins(pIdx, -rent);
            this.updatePlayerCoins(ownedBy, rent);
            this.pendingEvent.set({
              message: `💸 Pagaste $${rent} de alquiler a ${ownerPlayer.name} por ${sq.name}`,
              positive: false,
              amount: rent,
            });
          } else {
            const partial = player.coins;
            this.updatePlayerCoins(pIdx, -partial);
            this.updatePlayerCoins(ownedBy, partial);
            this.pendingEvent.set({
              message: `⚠️ Sin fondos suficientes. Pagaste solo $${partial} a ${ownerPlayer.name}`,
              positive: false,
            });
          }
        }
        break;
      }

      case 'tax': {
        const loss = Math.abs(sq.value ?? 0);
        this.updatePlayerCoins(pIdx, -loss);
        this.pendingEvent.set({ message: `${sq.icon} ${sq.name}: -$${loss}`, positive: false, amount: loss });
        break;
      }

      case 'bonus':
      case 'event': {
        const value = sq.value ?? 0;
        this.updatePlayerCoins(pIdx, value);
        this.pendingEvent.set({
          message: `${sq.icon} ${sq.name}: ${value > 0 ? '+' : ''}$${value}`,
          positive: value > 0,
          amount: value,
        });
        break;
      }

      case 'chance': {
        const ev = CHANCE_EVENTS[Math.floor(Math.random() * CHANCE_EVENTS.length)];
        this.updatePlayerCoins(pIdx, ev.value);
        this.pendingEvent.set({ message: `🃏 ${ev.message}`, positive: ev.value > 0, amount: ev.value });
        break;
      }

      case 'jail':
        this.players.update(players =>
          players.map((current, index) =>
            index === pIdx ? { ...current, inJail: true, jailTurns: 1 } : current
          )
        );
        this.pendingEvent.set({ message: '🔒 ¡A la cárcel! Pierdes el próximo turno', positive: false });
        break;

      case 'free':
        this.pendingEvent.set({ message: `${sq.icon} ${sq.name}: sin efecto. Descansa 😌`, positive: true });
        break;
    }
  }

  private updatePlayerPos(pIdx: number, pos: number) {
    this.players.update(players =>
      players.map((player, index) => (index === pIdx ? { ...player, position: pos } : player))
    );
  }

  private updatePlayerCoins(pIdx: number, delta: number) {
    this.players.update(players =>
      players.map((player, index) =>
        index === pIdx ? { ...player, coins: Math.max(0, player.coins + delta) } : player
      )
    );
  }
}
