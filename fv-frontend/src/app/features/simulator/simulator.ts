import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulatorService } from '../../core/services/simulator.service';
import { SimulatorHistoryEntry } from '../../core/models/simulator.model';

@Component({
  selector: 'app-simulator',
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.html'
})
export class Simulator implements OnInit {
  history = signal<SimulatorHistoryEntry[]>([]);
  loading = signal(true);
  starting = signal(false);

  playerCount = 1;
  playerNames: string[] = [''];

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

    const names = this.playerNames.map((n, i) => n.trim() || `Jugador ${i + 1}`);
    const creates = names.map(() => this.simulatorService.createGame());

    const players: { name: string; gameId: string }[] = [];
    let idx = 0;

    const createNext = () => {
      if (idx >= names.length) {
        this.starting.set(false);
        this.router.navigate(['/simulator', players[0].gameId], {
          state: { players, currentIndex: 0 }
        });
        return;
      }
      this.simulatorService.createGame().subscribe({
        next: g => {
          players.push({ name: names[idx], gameId: g.id });
          idx++;
          createNext();
        },
        error: () => this.starting.set(false)
      });
    };

    createNext();
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }
}