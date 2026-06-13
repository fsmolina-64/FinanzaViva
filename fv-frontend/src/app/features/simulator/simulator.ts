import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulatorService } from '../../core/services/simulator.service';
import { HistoryEntry, PlayerState } from '../../core/models/simulator.model';

@Component({
  selector: 'app-simulator',
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.html'
})
export class Simulator implements OnInit {
  history = signal<HistoryEntry[]>([]);
  loading = signal(true);
  starting = signal(false);

  playerCount = 1;
  playerNames: string[] = [''];

  difficultyOptions = [
    { label: 'Corta', rounds: 3 },
    { label: 'Media', rounds: 6 },
    { label: 'Larga', rounds: 10 }
  ];
  selectedRounds = 6;
  error = signal<string | null>(null);

  constructor(
    private simulatorService: SimulatorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.simulatorService.getHistory().subscribe({
      next: h => { this.history.set(h); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setPlayerCount(n: number): void {
    this.playerCount = n;
    this.playerNames = Array.from({ length: n }, (_, i) => this.playerNames[i] ?? '');
  }

  startGame(): void {
    if (this.starting()) return;
    this.starting.set(true);
    this.error.set(null);

    const names = this.playerNames.map((n, i) => n.trim() || `Jugador ${i + 1}`);

    const players: PlayerState[] = [];
    let idx = 0;

    const createNext = () => {
      if (idx >= names.length) {
        this.starting.set(false);
        this.router.navigate(['/simulator', players[0].gameId], {
          state: { players, currentIndex: 0 }
        });
        return;
      }
      const payload = {
        maxRounds: this.selectedRounds,
        roundType: 'MONTHLY',
        players: [{ displayName: names[idx] }]
      };
      this.simulatorService.createGame(payload).subscribe({
        next: g => {
          const bp = g.players?.[0];
          if (bp) {
            players.push({
              name: bp.displayName,
              gameId: g.id,
              playerId: bp.id,
              currentMoney: bp.money,
              currentDebt: bp.debt,
              currentScore: bp.financialScore
            });
          }
          idx++;
          createNext();
        },
        error: (err) => {
          this.starting.set(false);
          const msg = err?.error?.message;
          this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'Error al iniciar la partida.'));
        }
      });
    };

    createNext();
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }
}