import { Component, OnInit, signal } from '@angular/core';
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
interface BotConfig { displayName: string; personality: BotPersonality; }

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.html'
})
export class Simulator implements OnInit {
  history       = signal<HistoryEntry[]>([]);
  loading       = signal(true);
  starting      = signal(false);
  error         = signal<string | null>(null);
  currentUserName = signal<string>('Mi cuenta');
  expandedIds   = signal<Set<string>>(new Set());

  selectedMode: GameMode = 'SOLO';
  selectedRounds = 5;
  humanNames: string[] = [''];
  bots: BotConfig[] = [
    { displayName: 'Bot Conservador', personality: 'CONSERVATIVE' },
    { displayName: 'Bot Arriesgado', personality: 'RISKY' },
  ];

  readonly modeOptions: ModeOption[] = [
    { value: 'SOLO',        label: 'Solo',         description: 'Tu vs bots con personalidades financieras', tag: 'RECOMENDADO', minHumans: 1, maxHumans: 1, minBots: 1, maxBots: 3 },
    { value: 'MULTIPLAYER', label: 'Multijugador',  description: 'Compite contra amigos en el mismo dispositivo', tag: '', minHumans: 2, maxHumans: 4, minBots: 0, maxBots: 0 },
    { value: 'MIXED',       label: 'Mixto',         description: 'Humanos y bots en la misma partida', tag: '', minHumans: 1, maxHumans: 3, minBots: 1, maxBots: 3 },
    { value: 'SIMULATION',  label: 'Observar',      description: 'Mira como los bots juegan solos', tag: '', minHumans: 0, maxHumans: 0, minBots: 2, maxBots: 4 },
  ];

  readonly lapOptions = [
    { laps: 3, label: 'Rapido',    sub: '3 vueltas' },
    { laps: 5, label: 'Estandar',  sub: '5 vueltas' },
    { laps: 10, label: 'Intensivo', sub: '10 vueltas' },
  ];

  readonly personalities: { value: BotPersonality; label: string }[] = [
    { value: 'CONSERVATIVE', label: 'Conservador' },
    { value: 'RISKY',        label: 'Arriesgado'  },
    { value: 'IMPULSIVE',    label: 'Impulsivo'   },
    { value: 'INVESTOR',     label: 'Inversionista' },
    { value: 'SAVER',        label: 'Ahorrador'   },
  ];

  get selectedModeOption(): ModeOption {
    return this.modeOptions.find(m => m.value === this.selectedMode)!;
  }
  get showHumans(): boolean { return this.selectedMode !== 'SIMULATION'; }
  get showBots():   boolean { return this.selectedMode !== 'MULTIPLAYER'; }

  constructor(private svc: SimulatorService, private http: HttpClient, private router: Router) {}

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

  selectMode(mode: GameMode): void {
    this.selectedMode = mode;
    const opt = this.selectedModeOption;
    let h = this.humanNames.slice(0, opt.maxHumans);
    while (h.length < opt.minHumans) h.push('');
    this.humanNames = h;
    let b = this.bots.slice(0, opt.maxBots);
    while (b.length < opt.minBots) b.push({ displayName: `Bot ${b.length + 1}`, personality: (['CONSERVATIVE','RISKY','IMPULSIVE','INVESTOR','SAVER'] as BotPersonality[])[b.length % 5] });
    this.bots = b;
  }

  addHuman(): void { if (this.humanNames.length < this.selectedModeOption.maxHumans) this.humanNames = [...this.humanNames, '']; }
  removeHuman(i: number): void { if (this.humanNames.length > this.selectedModeOption.minHumans) this.humanNames = this.humanNames.filter((_, idx) => idx !== i); }
  addBot(): void { if (this.bots.length < this.selectedModeOption.maxBots) this.bots = [...this.bots, { displayName: `Bot ${this.bots.length + 1}`, personality: 'CONSERVATIVE' }]; }
  removeBot(i: number): void { if (this.bots.length > this.selectedModeOption.minBots) this.bots = this.bots.filter((_, idx) => idx !== i); }
  setBotPersonality(idx: number, p: BotPersonality): void { this.bots = this.bots.map((b, i) => i === idx ? { ...b, personality: p } : b); }

  toggleHistory(id: string): void {
    this.expandedIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  startGame(): void {
    if (this.starting()) return;
    this.starting.set(true);
    this.error.set(null);

    const humanPlayers = this.humanNames.map((n, i) => ({ displayName: n.trim() || `Jugador ${i + 1}` }));
    const botPlayers   = this.bots.map(b => ({ displayName: b.displayName.trim() || 'Bot', personality: b.personality }));

    this.svc.createGame({
      maxRounds: this.selectedRounds,
      mode: this.selectedMode,
      humanPlayers: this.showHumans ? humanPlayers : [],
      botPlayers: this.showBots ? botPlayers : undefined,
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
  formatMoney(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
  }
}
