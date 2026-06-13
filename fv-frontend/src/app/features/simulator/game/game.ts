import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulatorService } from '../../../core/services/simulator.service';
import {
  BackendGame,
  BackendEvent,
  BackendEventOption,
  DecisionResult,
  PlayerState
} from '../../../core/models/simulator.model';

type GamePhase = 'starting' | 'event' | 'result' | 'player-done' | 'final' | 'error';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html'
})
export class Game implements OnInit {
  phase = signal<GamePhase>('starting');
  game = signal<BackendGame | null>(null);
  currentEvent = signal<BackendEvent | null>(null);
  decisionResult = signal<DecisionResult | null>(null);
  selectedOption = signal<BackendEventOption | null>(null);
  deciding = signal(false);
  errorMessage = signal<string | null>(null);

  players = signal<PlayerState[]>([]);
  currentIndex = signal(0);

  get currentPlayer(): PlayerState {
    return this.players()[this.currentIndex()];
  }

  get roundProgress(): number {
    const g = this.game();
    if (!g) return 0;
    return (g.currentRound / g.maxRounds) * 100;
  }

  constructor(
    private simulatorService: SimulatorService,
    public router: Router
  ) { }

  ngOnInit(): void {
    const state = history.state as { players: PlayerState[]; currentIndex: number };
    if (!state?.players?.length) {
      this.router.navigate(['/simulator']);
      return;
    }
    this.players.set(state.players);
    this.currentIndex.set(state.currentIndex ?? 0);
    this.startCurrentPlayer();
  }

  private startCurrentPlayer(): void {
    this.phase.set('starting');
    this.selectedOption.set(null);
    this.decisionResult.set(null);
    this.currentEvent.set(null);
    this.errorMessage.set(null);

    this.simulatorService.startGame(this.currentPlayer.gameId).subscribe({
      next: game => {
        this.game.set(game);
        this.loadNextEvent();
      },
      error: err => {
        const msg = err.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al iniciar la partida.'));
        this.phase.set('error');
      }
    });
  }

  private loadNextEvent(): void {
    this.currentEvent.set(null);
    this.simulatorService.getRandomEvent().subscribe({
      next: event => {
        this.currentEvent.set(event);
        this.phase.set('event');
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el escenario. Intenta de nuevo.');
        this.phase.set('error');
      }
    });
  }

  selectOption(option: BackendEventOption): void {
    if (this.deciding()) return;
    this.selectedOption.set(option);
  }

  confirmDecision(): void {
    const option = this.selectedOption();
    const event = this.currentEvent();
    if (!option || !event || this.deciding()) return;

    this.deciding.set(true);

    this.simulatorService.submitDecision(this.currentPlayer.gameId, {
      playerId: this.currentPlayer.playerId,
      eventId: event.id,
      chosenOptionId: option.id
    }).subscribe({
      next: result => {
        this.players.update(list =>
          list.map((p, i) =>
            i === this.currentIndex()
              ? { ...p, currentMoney: result.moneyAfter, currentDebt: result.debtAfter, currentScore: result.scoreAfter }
              : p
          )
        );
        this.decisionResult.set(result);
        this.deciding.set(false);
        this.phase.set('result');
      },
      error: err => {
        this.deciding.set(false);
        const msg = err.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al procesar la decision.'));
      }
    });
  }

  nextRound(): void {
    this.simulatorService.nextRound(this.currentPlayer.gameId).subscribe({
      next: game => {
        this.game.set(game);
        this.selectedOption.set(null);
        this.decisionResult.set(null);

        if (game.status === 'FINISHED') {
          const p = this.currentPlayer;
          this.players.update(list =>
            list.map((player, i) =>
              i === this.currentIndex()
                ? { ...player, finalScore: p.currentScore, finalBalance: p.currentMoney }
                : player
            )
          );
          this.phase.set('player-done');
        } else {
          this.phase.set('event');
          this.loadNextEvent();
        }
      },
      error: err => {
        const msg = err.error?.message;
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al avanzar ronda.'));
      }
    });
  }

  nextPlayer(): void {
    const next = this.currentIndex() + 1;
    if (next >= this.players().length) {
      this.phase.set('final');
    } else {
      this.currentIndex.set(next);
      this.startCurrentPlayer();
    }
  }

  retryEvent(): void {
    this.errorMessage.set(null);
    this.loadNextEvent();
  }

  sortedPlayers(): PlayerState[] {
    return [...this.players()].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
  }


  optionImpact(option: BackendEventOption): string {
    const parts: string[] = [];
    const money = Number(option.effectMoney);
    const debt = Number(option.effectDebt);
    const score = Number(option.effectScore);

    if (money !== 0) parts.push(`${money > 0 ? '+' : ''}${this.formatCurrency(money)}`);
    if (debt !== 0) parts.push(`deuda ${debt > 0 ? '+' : ''}${this.formatCurrency(debt)}`);
    if (score !== 0) parts.push(`${score > 0 ? '+' : ''}${score} pts`);

    return parts.length ? parts.join(' · ') : 'Sin impacto financiero';
  }

  optionImpactClass(option: BackendEventOption): string {
    const money = Number(option.effectMoney);
    if (money > 0) return 'text-emerald-400';
    if (money < 0) return 'text-red-400';
    return 'text-slate-400';
  }

  resultChangeClass(delta: number): string {
    if (delta > 0) return 'text-emerald-400';
    if (delta < 0) return 'text-red-400';
    return 'text-slate-400';
  }

  isGoodDecision(result: DecisionResult): boolean {
    return result.scoreAfter >= result.scoreBefore;
  }

  scoreLabel(score: number): string {
    if (score >= 750) return 'Excelente';
    if (score >= 650) return 'Bueno';
    if (score >= 550) return 'Regular';
    if (score >= 450) return 'En riesgo';
    return 'Critico';
  }

  scoreClass(score: number): string {
    if (score >= 650) return 'text-emerald-400';
    if (score >= 500) return 'text-yellow-400';
    return 'text-red-400';
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }
}