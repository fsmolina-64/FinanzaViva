import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SimulatorService } from '../../core/services/simulator.service';
import { GameMode, BotPersonality, HistoryEntry } from '../../core/models/simulator.model';
import { environment } from '../../../environments/environment';

interface ModeOption {
  value: GameMode; label: string; description: string; tag: string;
  minHumans: number; maxHumans: number; minBots: number; maxBots: number;
}
interface BotConfig   { displayName: string; personality: BotPersonality; tokenSymbol: string; }
interface HumanConfig { displayName: string; tokenSymbol: string; }

export const TOKEN_OPTIONS = [
  { symbol: '★', label: 'Estrella'   },
  { symbol: '♦', label: 'Diamante'   },
  { symbol: '♣', label: 'Trebol'     },
  { symbol: '♥', label: 'Corazon'    },
  { symbol: '■', label: 'Cuadrado'   },
  { symbol: '▲', label: 'Triangulo'  },
  { symbol: '●', label: 'Circulo'    },
  { symbol: '◆', label: 'Rombo'      },
];

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.html'
})
export class Simulator implements OnInit {
  history     = signal<HistoryEntry[]>([]);
  loading     = signal(true);
  starting    = signal(false);
  error       = signal<string | null>(null);
  currentUserName = signal<string>('Mi cuenta');
  expandedIds = signal<Set<string>>(new Set());

  historySort       = signal<'newest' | 'oldest'>('newest');
  historyDateFilter = signal('');

  filteredHistory = computed(() => {
    let h = [...this.history()];
    if (this.historyDateFilter()) {
      const fd = new Date(this.historyDateFilter()).toDateString();
      h = h.filter(x => new Date(x.finishedAt).toDateString() === fd);
    }
    h.sort((a, b) => {
      const diff = new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime();
      return this.historySort() === 'newest' ? diff : -diff;
    });
    return h;
  });

  selectedMode: GameMode = 'SOLO';
  selectedRounds = 5;

  humans: HumanConfig[] = [{ displayName: '', tokenSymbol: '★' }];
  bots: BotConfig[] = [
    { displayName: 'Bot Conservador',  personality: 'CONSERVATIVE', tokenSymbol: '■' },
    { displayName: 'Bot Arriesgado',   personality: 'RISKY',        tokenSymbol: '▲' },
  ];

  readonly TOKEN_OPTIONS = TOKEN_OPTIONS;

  readonly modeOptions: ModeOption[] = [
    { value: 'SOLO',        label: 'Solo',        description: 'Tu vs bots con personalidades financieras', tag: 'RECOMENDADO', minHumans: 1, maxHumans: 1, minBots: 1, maxBots: 3 },
    { value: 'MULTIPLAYER', label: 'Multijugador', description: 'Compite contra amigos en el mismo dispositivo', tag: '', minHumans: 2, maxHumans: 4, minBots: 0, maxBots: 0 },
    { value: 'MIXED',       label: 'Mixto',        description: 'Humanos y bots en la misma partida', tag: '', minHumans: 1, maxHumans: 3, minBots: 1, maxBots: 3 },
    { value: 'SIMULATION',  label: 'Observar',     description: 'Mira como los bots juegan solos (sin XP)', tag: '', minHumans: 0, maxHumans: 0, minBots: 2, maxBots: 4 },
  ];

  readonly lapOptions = [
    { laps: 3,  label: 'Rapido',    sub: '3 vueltas',   money: 1000 },
    { laps: 5,  label: 'Estandar',  sub: '5 vueltas',   money: 1500 },
    { laps: 10, label: 'Intensivo', sub: '10 vueltas',  money: 2000 },
  ];

  readonly personalities: { value: BotPersonality; label: string }[] = [
    { value: 'CONSERVATIVE', label: 'Conservador'   },
    { value: 'RISKY',        label: 'Arriesgado'    },
    { value: 'IMPULSIVE',    label: 'Impulsivo'     },
    { value: 'INVESTOR',     label: 'Inversionista' },
    { value: 'SAVER',        label: 'Ahorrador'     },
  ];

  get selectedModeOption(): ModeOption {
    return this.modeOptions.find(m => m.value === this.selectedMode)!;
  }
  get showHumans(): boolean { return this.selectedMode !== 'SIMULATION'; }
  get showBots():   boolean { return this.selectedMode !== 'MULTIPLAYER'; }

  get suggestedMoney(): number {
    const opt = this.lapOptions.find(o => o.laps === this.selectedRounds);
    return opt?.money ?? 1500;
  }

  get estimatedMaxXP(): number {
    if (this.selectedMode === 'SIMULATION') return 15;
    const base = this.selectedRounds <= 3 ? 50
               : this.selectedRounds <= 5 ? 80
               : this.selectedRounds <= 7 ? 120 : 175;
    return base * 2;
  }

  usedTokens = computed(() => [
    ...this.humans.map(h => h.tokenSymbol),
    ...this.bots.map(b => b.tokenSymbol),
  ]);

  constructor(
    private svc: SimulatorService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.svc.getHistory().subscribe({
      next: h => { this.history.set(h); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
      next: u => this.currentUserName.set(u?.profile?.displayName ?? u?.email ?? 'Mi cuenta'),
      error: () => {},
    });
  }

  private personalityLabel(p: BotPersonality): string {
    return { CONSERVATIVE:'Conservador', RISKY:'Arriesgado', IMPULSIVE:'Impulsivo', INVESTOR:'Inversionista', SAVER:'Ahorrador' }[p] ?? p;
  }

  private isAutoName(name: string, p: BotPersonality): boolean {
    return name.startsWith('Bot ') || name === '';
  }

  setBotPersonality(idx: number, p: BotPersonality): void {
    this.bots = this.bots.map((b, i) => {
      if (i !== idx) return b;
      const newName = this.isAutoName(b.displayName, b.personality)
        ? `Bot ${this.personalityLabel(p)}`
        : b.displayName;
      return { ...b, personality: p, displayName: newName };
    });
  }

  getAvailableTokens(currentSymbol: string): typeof TOKEN_OPTIONS {
    const used = this.usedTokens().filter(s => s !== currentSymbol);
    return TOKEN_OPTIONS.filter(t => !used.includes(t.symbol));
  }

  setHumanToken(idx: number, symbol: string): void {
    this.humans = this.humans.map((h, i) => i === idx ? { ...h, tokenSymbol: symbol } : h);
  }

  setBotToken(idx: number, symbol: string): void {
    this.bots = this.bots.map((b, i) => i === idx ? { ...b, tokenSymbol: symbol } : b);
  }

  selectMode(mode: GameMode): void {
    this.selectedMode = mode;
    const opt = this.selectedModeOption;

    let h = this.humans.slice(0, opt.maxHumans);
    while (h.length < opt.minHumans) h.push({ displayName: '', tokenSymbol: this.nextFreeToken(h.map(x => x.tokenSymbol)) });
    this.humans = h;

    let b = this.bots.slice(0, opt.maxBots);
    while (b.length < opt.minBots) {
      const p = (['CONSERVATIVE','RISKY','IMPULSIVE','INVESTOR','SAVER'] as BotPersonality[])[b.length % 5];
      b.push({ displayName: `Bot ${this.personalityLabel(p)}`, personality: p, tokenSymbol: this.nextFreeToken([...this.humans.map(x => x.tokenSymbol), ...b.map(x => x.tokenSymbol)]) });
    }
    this.bots = b;
  }

  selectRounds(laps: number): void {
    this.selectedRounds = laps;
  }

  private nextFreeToken(used: string[]): string {
    return TOKEN_OPTIONS.find(t => !used.includes(t.symbol))?.symbol ?? '★';
  }

  addHuman(): void {
    if (this.humans.length >= this.selectedModeOption.maxHumans) return;
    this.humans = [...this.humans, { displayName: '', tokenSymbol: this.nextFreeToken(this.usedTokens()) }];
  }

  removeHuman(i: number): void {
    if (this.humans.length <= this.selectedModeOption.minHumans) return;
    this.humans = this.humans.filter((_, idx) => idx !== i);
  }

  addBot(): void {
    if (this.bots.length >= this.selectedModeOption.maxBots) return;
    const p = (['CONSERVATIVE','RISKY','IMPULSIVE','INVESTOR','SAVER'] as BotPersonality[])[this.bots.length % 5];
    this.bots = [...this.bots, { displayName: `Bot ${this.personalityLabel(p)}`, personality: p, tokenSymbol: this.nextFreeToken(this.usedTokens()) }];
  }

  removeBot(i: number): void {
    if (this.bots.length <= this.selectedModeOption.minBots) return;
    this.bots = this.bots.filter((_, idx) => idx !== i);
  }

  toggleHistory(id: string): void {
    this.expandedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  clearDateFilter(): void { this.historyDateFilter.set(''); }

  startGame(): void {
    if (this.starting()) return;
    this.starting.set(true);
    this.error.set(null);

    const humanPlayers = this.humans.map((h, i) => ({
      displayName: h.displayName.trim() || `Jugador ${i + 1}`,
      tokenSymbol: h.tokenSymbol,
    }));
    const botPlayers = this.bots.map(b => ({
      displayName: b.displayName.trim() || 'Bot',
      personality: b.personality,
      tokenSymbol: b.tokenSymbol,
    }));

    this.svc.createGame({
      maxRounds:    this.selectedRounds,
      mode:         this.selectedMode,
      initialMoney: this.suggestedMoney,
      humanPlayers: this.showHumans ? humanPlayers : [],
      botPlayers:   this.showBots ? botPlayers : undefined,
    }).subscribe({
      next: g => { this.starting.set(false); this.router.navigate(['/simulator', g.id]); },
      error: err => {
        this.starting.set(false);
        const msg = err?.error?.message;
        this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al crear la partida.'));
      },
    });
  }

  modeLabel(mode: GameMode): string {
    return this.modeOptions.find(m => m.value === mode)?.label ?? mode;
  }
  statusLabel(status: string): string {
    return { FINISHED: 'Completada', ABANDONED: 'Abandonada', IN_PROGRESS: 'En progreso' }[status] ?? status;
  }
  fmt(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
  }
}
