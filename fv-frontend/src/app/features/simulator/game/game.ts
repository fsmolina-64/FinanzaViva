import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SimulatorService } from '../../../core/services/simulator.service';
import {
  BackendGame, BackendPlayer, BackendEventOption, DecisionResult
} from '../../../core/models/simulator.model';

type GamePhase = 'loading' | 'event' | 'deciding' | 'result' | 'handoff' | 'final' | 'error';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html'
})
export class Game implements OnInit {
  phase = signal<GamePhase>('loading');
  gameState = signal<BackendGame | null>(null);
  lastResult = signal<DecisionResult | null>(null);
  selectedOption = signal<BackendEventOption | null>(null);
  errorMessage = signal<string | null>(null);
  actingPlayer = signal<BackendPlayer | null>(null);

  private prevPlayerId: string | null = null;

  gameId!: string;

  currentPlayer = computed<BackendPlayer | null>(() => {
    const g = this.gameState();
    if (!g?.players || !g.currentPlayerId) return null;
    return g.players.find(p => p.id === g.currentPlayerId) ?? null;
  });

  rankedPlayers = computed<BackendPlayer[]>(() => {
    const g = this.gameState();
    if (!g?.players) return [];
    return [...g.players].sort((a, b) => (b.financialScore ?? 0) - (a.financialScore ?? 0));
  });

  roundProgress = computed<number>(() => {
    const g = this.gameState();
    if (!g) return 0;
    return Math.min(100, (g.currentRound / g.maxRounds) * 100);
  });

  get isMultiHuman(): boolean {
    const mode = this.gameState()?.mode;
    return mode === 'MULTIPLAYER' || mode === 'MIXED';
  }

  constructor(
    private simulatorService: SimulatorService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.params['id'];
    if (!this.gameId) { this.router.navigate(['/simulator']); return; }

    this.simulatorService.startGame(this.gameId).subscribe({
      next: gs => this.applyGameState(gs),
      error: err => {
        const msg = err?.error?.message;
        if (err?.status === 400) {
          this.simulatorService.getGameState(this.gameId).subscribe({
            next: gs => this.applyGameState(gs),
            error: () => this.router.navigate(['/simulator'])
          });
        } else {
          this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al iniciar la partida.'));
          this.phase.set('error');
        }
      }
    });
  }

  private applyGameState(gs: BackendGame): void {
    this.gameState.set(gs);
    this.selectedOption.set(null);

    if (gs.status === 'FINISHED') {
      this.phase.set('final');
      return;
    }

    if (!gs.currentEvent || !gs.currentPlayerId) {
      this.errorMessage.set('Error al cargar el escenario. Recarga la pagina.');
      this.phase.set('error');
      return;
    }

    this.prevPlayerId = gs.currentPlayerId;
    this.phase.set('event');
  }

  selectOption(opt: BackendEventOption): void {
    if (this.phase() === 'deciding') return;
    this.selectedOption.set(opt);
  }

  confirmDecision(): void {
    const opt = this.selectedOption();
    if (!opt || this.phase() === 'deciding') return;

    this.actingPlayer.set(this.currentPlayer());
    this.phase.set('deciding');
    this.errorMessage.set(null);

    this.simulatorService.submitDecision(this.gameId, opt.id).subscribe({
      next: ({ result, gameState }) => {
        this.lastResult.set(result);
        this.gameState.set(gameState);
        this.phase.set('result');
      },
      error: err => {
        const msg = err?.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al procesar la decisión.'));
        this.phase.set('event');
      }
    });
  }

  continueAfterResult(): void {
    const gs = this.gameState();
    if (!gs) return;

    if (gs.status === 'FINISHED') {
      this.phase.set('final');
      return;
    }

    const playerChanged = this.prevPlayerId !== gs.currentPlayerId;
    const needsHandoff = this.isMultiHuman && playerChanged;

    this.prevPlayerId = gs.currentPlayerId;

    if (needsHandoff) {
      this.phase.set('handoff');
    } else {
      this.lastResult.set(null);
      this.actingPlayer.set(null);
      this.phase.set('event');
    }
  }

  proceedFromHandoff(): void {
    this.lastResult.set(null);
    this.actingPlayer.set(null);
    this.phase.set('event');
  }


  n(v: any): number { return parseFloat(String(v)) || 0; }

  patrimonio(p: BackendPlayer): number {
    return this.n(p.money) + this.n(p.savings) + this.n(p.investments) - this.n(p.debt);
  }

  scoreLabel(score: number): string {
    if (score >= 750) return 'Excelente';
    if (score >= 650) return 'Bueno';
    if (score >= 550) return 'Regular';
    if (score >= 450) return 'En riesgo';
    return 'Critico';
  }

  scoreColor(score: number): string {
    if (score >= 750) return 'text-emerald-400';
    if (score >= 650) return 'text-blue-400';
    if (score >= 550) return 'text-yellow-400';
    if (score >= 450) return 'text-orange-400';
    return 'text-red-400';
  }

  scoreBar(score: number): string {
    if (score >= 750) return 'bg-emerald-500';
    if (score >= 650) return 'bg-blue-500';
    if (score >= 550) return 'bg-yellow-500';
    if (score >= 450) return 'bg-orange-500';
    return 'bg-red-500';
  }

  deltaColor(delta: number, inverse = false): string {
    const good = inverse ? delta < 0 : delta > 0;
    const bad = inverse ? delta > 0 : delta < 0;
    if (good) return 'text-emerald-400';
    if (bad) return 'text-red-400';
    return 'text-slate-400';
  }

  sign(v: number): string { return v > 0 ? '+' : ''; }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }
}