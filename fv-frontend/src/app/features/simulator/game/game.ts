import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SimulatorService } from '../../../core/services/simulator.service';
import { SimulatorGameDetail, SimulatorRoundResult } from '../../../core/models/simulator.model';

interface PlayerState {
  name: string;
  gameId: string;
  finalScore?: number;
  finalBalance?: number;
}

type GamePhase = 'starting' | 'event' | 'result' | 'player-done' | 'final';

@Component({
  selector: 'app-game',
  imports: [CommonModule],
  templateUrl: './game.html'
})
export class Game implements OnInit {
  phase = signal<GamePhase>('starting');
  game = signal<SimulatorGameDetail | null>(null);
  roundResult = signal<SimulatorRoundResult | null>(null);
  selectedOption = signal<string | null>(null);
  deciding = signal(false);

  players = signal<PlayerState[]>([]);
  currentIndex = signal(0);

  get currentPlayer(): PlayerState {
    return this.players()[this.currentIndex()];
  }

  constructor(
    private simulatorService: SimulatorService,
    public router: Router
  ) { }

  ngOnInit(): void {
    const state = history.state as { players: PlayerState[]; currentIndex: number };
    if (!state?.players) {
      this.router.navigate(['/simulator']);
      return;
    }
    this.players.set(state.players);
    this.currentIndex.set(state.currentIndex);
    this.startCurrentPlayer();
  }

  private startCurrentPlayer(): void {
    this.phase.set('starting');
    this.selectedOption.set(null);
    this.roundResult.set(null);
    this.simulatorService.startGame(this.currentPlayer.gameId).subscribe({
      next: g => { this.game.set(g); this.phase.set('event'); }
    });
  }

  selectOption(optionId: string): void {
    if (this.deciding()) return;
    this.selectedOption.set(optionId);
  }

  confirmDecision(): void {
    if (!this.selectedOption() || this.deciding()) return;
    this.deciding.set(true);
    this.simulatorService.makeDecision(this.currentPlayer.gameId, {
      optionId: this.selectedOption()!
    }).subscribe({
      next: result => {
        this.roundResult.set(result);
        this.deciding.set(false);
        this.phase.set('result');
      },
      error: () => this.deciding.set(false)
    });
  }

  nextRound(): void {
    this.simulatorService.nextRound(this.currentPlayer.gameId).subscribe({
      next: g => {
        this.game.set(g);
        this.selectedOption.set(null);
        this.roundResult.set(null);
        if (g.status === 'FINISHED') {
          this.players.update(list => list.map((p, i) =>
            i === this.currentIndex()
              ? { ...p, finalScore: g.score, finalBalance: g.balance }
              : p
          ));
          this.phase.set('player-done');
        } else {
          this.phase.set('event');
        }
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

  sortedPlayers(): PlayerState[] {
    return [...this.players()].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }
}