import { Injectable, signal, computed } from '@angular/core';

export type FinancialProfile = 'ahorrista' | 'inversor' | 'gastador' | 'equilibrado';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  xpReward: number;
}

export interface PowerCard {
  id: string;
  name: string;
  description: string;
  type: 'boost' | 'shield' | 'steal' | 'skip';
  color: string;
  uses: number;
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

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  description: string;
  date: Date;
  category: string;
  icon: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  salary: number;
  icon: string;
  requirements: string;
  minLevel: number;
  active: boolean;
}

export interface BoardSquare {
  id: number;
  type: 'start' | 'investment' | 'debt' | 'bonus' | 'event' | 'tax' | 'free';
  title: string;
  description: string;
  value: number;
  color: string;
  icon: string;
}

export interface RankingPlayer {
  rank: number;
  name: string;
  avatar: string;
  coins: number;
  level: number;
  xp: number;
  profile: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  // Core player stats
  coins = signal(5000);
  xp = signal(0);
  level = signal(1);
  playerName = signal('Jugador');
  playerAvatar = signal('🦊');
  financialProfile = signal<FinancialProfile | null>(null);
  debt = signal(0);

  // Game board
  boardPosition = signal(0);
  diceResult = signal<number[]>([1, 1]);
  isRolling = signal(false);

  // Quiz
  correctAnswers = signal(0);

  // Achievements
  achievements = signal<Achievement[]>([
    { id: 'first_steps', title: 'Primeros Pasos', description: 'Completa el perfil financiero', icon: '👣', unlocked: false, xpReward: 50 },
    { id: 'first_save', title: 'Alcancía Llena', description: 'Acumula 1,000 monedas', icon: '🐷', unlocked: false, xpReward: 75 },
    { id: 'investor', title: 'Inversor Novato', description: 'Compra tu primera acción', icon: '📈', unlocked: false, xpReward: 100 },
    { id: 'quiz_5', title: 'Estudiante Aplicado', description: 'Responde 5 preguntas correctas', icon: '🎓', unlocked: false, xpReward: 150 },
    { id: 'debt_free', title: 'Libre de Deudas', description: 'Paga toda tu deuda', icon: '⛓️', unlocked: false, xpReward: 200 },
    { id: 'level_5', title: 'Nivel Pro', description: 'Alcanza el nivel 5', icon: '⭐', unlocked: false, xpReward: 300 },
    { id: 'millionaire', title: 'El Millonario', description: 'Acumula 100,000 monedas', icon: '💎', unlocked: false, xpReward: 500 },
    { id: 'board_lap', title: 'Una Vuelta Completa', description: 'Da una vuelta al tablero', icon: '🎲', unlocked: false, xpReward: 100 },
  ]);

  // Power cards
  powerCards = signal<PowerCard[]>([
    { id: 'double', name: 'Doble o Nada', description: 'Duplica tu próximo ingreso del tablero', type: 'boost', color: '#f5a623', uses: 2 },
    { id: 'shield', name: 'Escudo Fiscal', description: 'Ignora el próximo evento negativo', type: 'shield', color: '#6366f1', uses: 1 },
    { id: 'skip', name: 'Turno Extra', description: 'Avanza 3 casillas adicionales', type: 'skip', color: '#00d4aa', uses: 1 },
  ]);

  // Active power card
  activePower = signal<string | null>(null);

  // Stocks
  stocks = signal<Stock[]>([
    { symbol: 'TEC', name: 'TechNova Corp', price: 150, change: 3.5, changePercent: 2.39, owned: 0, history: [140, 145, 138, 152, 150] },
    { symbol: 'ENR', name: 'EnerSol Plus', price: 80, change: -1.2, changePercent: -1.48, owned: 0, history: [85, 82, 81, 82, 80] },
    { symbol: 'BNK', name: 'BancoFuturo', price: 220, change: 0.8, changePercent: 0.36, owned: 0, history: [215, 218, 217, 221, 220] },
    { symbol: 'ALM', name: 'AlimCo SA', price: 45, change: 4.1, changePercent: 10.03, owned: 0, history: [39, 41, 43, 42, 45] },
    { symbol: 'SAL', name: 'SaludVida Inc', price: 320, change: -5.5, changePercent: -1.69, owned: 0, history: [330, 328, 325, 322, 320] },
  ]);

  // Jobs
  jobs = signal<Job[]>([
    { id: 'freelance', title: 'Freelancer Digital', company: 'Tu Cuenta Propia', salary: 800, icon: '💻', requirements: 'Disponible desde el inicio', minLevel: 1, active: true },
    { id: 'analyst', title: 'Analista Junior', company: 'FinCorp SA', salary: 1800, icon: '📊', requirements: 'Requiere Nivel 3', minLevel: 3, active: false },
    { id: 'developer', title: 'Desarrollador Mid', company: 'TechNova Corp', salary: 3200, icon: '🚀', requirements: 'Requiere Nivel 5', minLevel: 5, active: false },
    { id: 'manager', title: 'Gerente de Finanzas', company: 'BancoFuturo', salary: 6000, icon: '🏦', requirements: 'Requiere Nivel 8', minLevel: 8, active: false },
  ]);

  // Transaction history
  transactions = signal<Transaction[]>([
    { id: '1', type: 'income', amount: 2000, description: 'Bono de bienvenida', date: new Date(), category: 'bono', icon: '🎁' },
    { id: '2', type: 'expense', amount: -350, description: 'Suscripciones digitales', date: new Date(), category: 'estilo', icon: '📱' },
    { id: '3', type: 'income', amount: 500, description: 'Quiz completado', date: new Date(), category: 'academia', icon: '🎓' },
  ]);

  // Board squares
  boardSquares = signal<BoardSquare[]>([
    { id: 0, type: 'start', title: 'SALIDA', description: 'Cobras $500 por vuelta', value: 500, color: '#00d4aa', icon: '🏁' },
    { id: 1, type: 'investment', title: 'Acciones TEC', description: 'Oportunidad de inversión', value: 200, color: '#6366f1', icon: '📈' },
    { id: 2, type: 'tax', title: 'Impuesto Renta', description: 'El estado cobra su parte', value: -150, color: '#f43f5e', icon: '🏛️' },
    { id: 3, type: 'bonus', title: 'Dividendo Extra', description: 'Tu empresa paga dividendos', value: 300, color: '#f5a623', icon: '💰' },
    { id: 4, type: 'event', title: '¡Inflación!', description: 'Los precios suben', value: -100, color: '#f97316', icon: '📊' },
    { id: 5, type: 'investment', title: 'Fondo de Ahorro', description: 'Interés mensual ganado', value: 250, color: '#6366f1', icon: '🏦' },
    { id: 6, type: 'debt', title: 'Emergencia Médica', description: 'Gasto inesperado', value: -400, color: '#ef4444', icon: '🏥' },
    { id: 7, type: 'free', title: 'Tiempo Libre', description: 'Descansa un turno', value: 0, color: '#64748b', icon: '☀️' },
    { id: 8, type: 'bonus', title: 'Cliente Nuevo', description: 'Proyecto freelance pagado', value: 350, color: '#f5a623', icon: '💼' },
    { id: 9, type: 'event', title: 'Bono Empresarial', description: 'Tu empresa te reconoce', value: 600, color: '#10b981', icon: '🎁' },
    { id: 10, type: 'tax', title: 'Multa de Tránsito', description: 'Mala suerte', value: -200, color: '#f43f5e', icon: '🚗' },
    { id: 11, type: 'investment', title: 'Startup Riesgosa', description: 'Todo o nada', value: 0, color: '#8b5cf6', icon: '🎰' },
    { id: 12, type: 'free', title: 'VISITA', description: 'Solo de paso', value: 0, color: '#64748b', icon: '🔁' },
    { id: 13, type: 'bonus', title: 'Consultoría', description: 'Tu conocimiento tiene valor', value: 400, color: '#f5a623', icon: '🧠' },
    { id: 14, type: 'event', title: 'Crisis Global', description: 'Mercados a la baja', value: -300, color: '#dc2626', icon: '🌍' },
    { id: 15, type: 'investment', title: 'Finca Raíz', description: 'Inversión en propiedad', value: 500, color: '#6366f1', icon: '🏠' },
    { id: 16, type: 'free', title: 'Vacaciones', description: 'Recarga energías', value: 0, color: '#64748b', icon: '🌴' },
    { id: 17, type: 'tax', title: 'IVA Especial', description: 'Cobro extra fiscal', value: -250, color: '#f43f5e', icon: '📄' },
    { id: 18, type: 'bonus', title: '¡Premio!', description: 'Ganaste un concurso local', value: 800, color: '#f5a623', icon: '🎉' },
    { id: 19, type: 'event', title: 'Automatización', description: 'La IA toma tu trabajo temp.', value: -150, color: '#f97316', icon: '🤖' },
    { id: 20, type: 'investment', title: 'ETF Global', description: 'Inversión diversificada', value: 300, color: '#6366f1', icon: '🌐' },
    { id: 21, type: 'debt', title: 'Cuota Préstamo', description: 'Pago mensual de deuda', value: -350, color: '#ef4444', icon: '📜' },
    { id: 22, type: 'bonus', title: 'Referido Activo', description: 'Tu red te genera dinero', value: 250, color: '#f5a623', icon: '👥' },
    { id: 23, type: 'event', title: '¡Aumento Salarial!', description: 'Tu jefe reconoce tu trabajo', value: 700, color: '#10b981', icon: '⬆️' },
  ]);

  // Ranking data (simulated other players)
  rankingPlayers = signal<RankingPlayer[]>([
    { rank: 1, name: 'SofíaInvierte', avatar: '🦁', coins: 87500, level: 12, xp: 2400, profile: 'inversor' },
    { rank: 2, name: 'CarlosAhorra', avatar: '🐻', coins: 64200, level: 10, xp: 2000, profile: 'ahorrista' },
    { rank: 3, name: 'MariaPro', avatar: '🦊', coins: 52800, level: 9, xp: 1800, profile: 'equilibrado' },
    { rank: 4, name: 'JuanFinanzas', avatar: '🐯', coins: 41300, level: 8, xp: 1600, profile: 'inversor' },
    { rank: 5, name: 'LunaRich', avatar: '🦋', coins: 33700, level: 7, xp: 1400, profile: 'ahorrista' },
    { rank: 6, name: 'PedroGrow', avatar: '🐺', coins: 28900, level: 6, xp: 1200, profile: 'equilibrado' },
    { rank: 7, name: 'AnaCapital', avatar: '🦅', coins: 21500, level: 5, xp: 1000, profile: 'inversor' },
    { rank: 8, name: 'DiegoSmart', avatar: '🦉', coins: 17200, level: 4, xp: 800, profile: 'ahorrista' },
  ]);

  // Computed
  xpToNextLevel = computed(() => this.level() * 200);
  xpProgress = computed(() => {
    const currentLevelXP = (this.level() - 1) * 200;
    const xpInLevel = this.xp() - currentLevelXP;
    return Math.min(100, Math.max(0, (xpInLevel / (this.level() * 200)) * 100));
  });
  unlockedAchievements = computed(() => this.achievements().filter(a => a.unlocked).length);
  totalPortfolioValue = computed(() => this.stocks().reduce((sum, s) => sum + s.owned * s.price, 0));
  activeJob = computed(() => this.jobs().find(j => j.active) || null);
  netWorth = computed(() => this.coins() + this.totalPortfolioValue() - this.debt());

  // Player rank in leaderboard
  playerRank = computed(() => {
    const net = this.netWorth();
    const players = this.rankingPlayers();
    return players.filter(p => p.coins > net).length + 1;
  });

  addCoins(amount: number, description = 'Ganancia', icon = '💰') {
    this.coins.update(c => c + amount);
    this.addXP(Math.floor(amount / 20));
    this.addTransaction('income', amount, description, 'general', icon);
    this.checkAchievements();
  }

  removeCoins(amount: number): boolean {
    if (this.coins() >= amount) {
      this.coins.update(c => c - amount);
      return true;
    }
    return false;
  }

  addXP(amount: number) {
    this.xp.update(x => x + amount);
    const newLevel = Math.floor(this.xp() / 200) + 1;
    if (newLevel > this.level()) {
      this.level.set(newLevel);
      if (newLevel >= 5) this.unlockAchievement('level_5');
    }
  }

  async rollDice(): Promise<number[]> {
    return new Promise(resolve => {
      this.isRolling.set(true);
      let count = 0;
      const interval = setInterval(() => {
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;
        this.diceResult.set([r1, r2]);
        count++;
        if (count >= 10) {
          clearInterval(interval);
          this.isRolling.set(false);
          const total = this.diceResult()[0] + this.diceResult()[1];
          const oldPos = this.boardPosition();
          const newPos = (oldPos + total) % 24;
          if (newPos < oldPos) this.unlockAchievement('board_lap');
          this.boardPosition.set(newPos);
          resolve(this.diceResult());
        }
      }, 80);
    });
  }

  applySquareEffect(squareId: number): { message: string; positive: boolean } | null {
    const square = this.boardSquares().find(s => s.id === squareId);
    if (!square) return null;

    const shielded = this.activePower() === 'shield';
    const boosted = this.activePower() === 'double';
    this.activePower.set(null);

    if (square.id === 0) {
      this.addCoins(500, 'Salario por vuelta', '🏁');
      return { message: '¡Completas una vuelta! +$500 de salario 🏁', positive: true };
    }

    if (square.id === 11) {
      const win = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 500) + 200;
      if (win) {
        const reward = boosted ? amount * 2 : amount;
        this.addCoins(reward, 'Startup exitosa', '🎰');
        return { message: `¡La startup fue un éxito! +$${reward} 🎰`, positive: true };
      } else {
        if (shielded) return { message: 'Tu Escudo Fiscal te protegió de la startup fallida 🛡️', positive: true };
        this.removeCoins(amount);
        return { message: `La startup fracasó. -$${amount} 😬`, positive: false };
      }
    }

    if (square.value > 0) {
      const reward = boosted ? square.value * 2 : square.value;
      this.addCoins(reward, square.title, square.icon);
      return { message: `${square.icon} ${square.title}: +$${reward}${boosted ? ' (×2 💥)' : ''}`, positive: true };
    } else if (square.value < 0) {
      if (shielded) return { message: `Tu Escudo Fiscal te protegió de ${square.title} 🛡️`, positive: true };
      const loss = Math.abs(square.value);
      if (!this.removeCoins(loss)) {
        const diff = loss - this.coins();
        this.debt.update(d => d + diff);
        this.coins.set(0);
      }
      return { message: `${square.icon} ${square.title}: -$${loss}`, positive: false };
    }

    return { message: `${square.icon} ${square.title} — sin efecto económico`, positive: true };
  }

  usePowerCard(cardId: string) {
    const card = this.powerCards().find(c => c.id === cardId && c.uses > 0);
    if (!card) return false;
    this.activePower.set(cardId);
    this.powerCards.update(arr => arr.map(c => c.id === cardId ? { ...c, uses: c.uses - 1 } : c));
    if (cardId === 'skip') {
      const newPos = (this.boardPosition() + 3) % 24;
      this.boardPosition.set(newPos);
      this.activePower.set(null);
    }
    return true;
  }

  buyStock(symbol: string, quantity: number): boolean {
    const stock = this.stocks().find(s => s.symbol === symbol);
    if (!stock) return false;
    const cost = Math.round(stock.price * quantity);
    if (this.removeCoins(cost)) {
      this.stocks.update(arr => arr.map(s => s.symbol === symbol ? { ...s, owned: s.owned + quantity } : s));
      this.addTransaction('investment', -cost, `Compra ${quantity}x ${symbol}`, 'inversión', '📈');
      this.unlockAchievement('investor');
      return true;
    }
    return false;
  }

  sellStock(symbol: string, quantity: number): boolean {
    const stock = this.stocks().find(s => s.symbol === symbol);
    if (!stock || stock.owned < quantity) return false;
    const revenue = Math.round(stock.price * quantity);
    this.addCoins(revenue, `Venta ${quantity}x ${symbol}`, '💹');
    this.stocks.update(arr => arr.map(s => s.symbol === symbol ? { ...s, owned: s.owned - quantity } : s));
    return true;
  }

  setJob(jobId: string): boolean {
    const job = this.jobs().find(j => j.id === jobId);
    if (!job || this.level() < job.minLevel) return false;
    this.jobs.update(arr => arr.map(j => ({ ...j, active: j.id === jobId })));
    return true;
  }

  collectSalary(): number {
    const job = this.activeJob();
    if (!job) return 0;
    this.addCoins(job.salary, `Salario: ${job.title}`, '💼');
    return job.salary;
  }

  simulateMarket() {
    this.stocks.update(stocks =>
      stocks.map(s => {
        const change = parseFloat(((Math.random() - 0.45) * 12).toFixed(2));
        const newPrice = Math.max(1, parseFloat((s.price + change).toFixed(2)));
        const changePercent = parseFloat(((change / s.price) * 100).toFixed(2));
        return { ...s, price: newPrice, change, changePercent, history: [...s.history.slice(-4), newPrice] };
      })
    );
  }

  addQuizCorrect() {
    this.correctAnswers.update(n => n + 1);
    this.addCoins(200, 'Respuesta correcta en quiz', '🎓');
    this.addXP(50);
    if (this.correctAnswers() >= 5) this.unlockAchievement('quiz_5');
  }

  unlockAchievement(id: string) {
    const achievement = this.achievements().find(a => a.id === id && !a.unlocked);
    if (!achievement) return;
    this.achievements.update(arr => arr.map(a => (a.id === id ? { ...a, unlocked: true } : a)));
    this.addXP(achievement.xpReward);
  }

  addTransaction(type: Transaction['type'], amount: number, description: string, category: string, icon: string) {
    const tx: Transaction = { id: Date.now().toString(), type, amount, description, date: new Date(), category, icon };
    this.transactions.update(arr => [tx, ...arr].slice(0, 30));
  }

  setProfile(profile: FinancialProfile) {
    this.financialProfile.set(profile);
    const bonuses: Record<FinancialProfile, number> = { ahorrista: 1000, inversor: 750, gastador: 300, equilibrado: 800 };
    this.addCoins(bonuses[profile], `Bono de perfil: ${profile}`, '🎯');
    this.unlockAchievement('first_steps');
  }

  checkAchievements() {
    if (this.coins() >= 100000) this.unlockAchievement('millionaire');
    if (this.coins() >= 1000 || this.totalPortfolioValue() >= 1000) this.unlockAchievement('first_save');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
}
