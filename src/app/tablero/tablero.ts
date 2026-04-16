import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-tablero',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero {
  game = inject(GameService);

  isAnimating = signal(false);
  lastEvent = signal<{ message: string; positive: boolean } | null>(null);
  eventHistory = signal<{ message: string; positive: boolean; turn: number }[]>([]);
  turnCount = signal(0);
  showEventModal = signal(false);

  // Board layout: top row (0-5), right col (6-11), bottom row (12-17 reversed), left col (18-23 reversed)
  readonly topRow = [0, 1, 2, 3, 4, 5];
  readonly rightCol = [6, 7, 8, 9, 10, 11];
  readonly bottomRow = [17, 16, 15, 14, 13, 12];
  readonly leftCol = [23, 22, 21, 20, 19, 18];

  get squares() {
    return this.game.boardSquares();
  }

  getSquare(id: number) {
    return this.squares.find(s => s.id === id)!;
  }

  isCurrentPosition(id: number): boolean {
    return this.game.boardPosition() === id;
  }

  async roll() {
    if (this.isAnimating() || this.game.isRolling()) return;
    this.isAnimating.set(true);
    this.lastEvent.set(null);

    await this.game.rollDice();
    this.turnCount.update(t => t + 1);

    // Small delay for animation
    await new Promise(r => setTimeout(r, 500));

    const pos = this.game.boardPosition();
    const effect = this.game.applySquareEffect(pos);

    if (effect) {
      this.lastEvent.set(effect);
      this.eventHistory.update(h => [
        { ...effect, turn: this.turnCount() },
        ...h,
      ].slice(0, 15));
      this.showEventModal.set(true);
    }

    this.isAnimating.set(false);
  }

  closeModal() {
    this.showEventModal.set(false);
  }

  getSquareTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      start: 'INICIO', investment: 'INVERSIÓN', debt: 'DEUDA',
      bonus: 'BONO', event: 'EVENTO', tax: 'IMPUESTO', free: 'LIBRE',
    };
    return labels[type] || type.toUpperCase();
  }

  usePower(cardId: string) {
    this.game.usePowerCard(cardId);
  }

  get availableCards() {
    return this.game.powerCards().filter(c => c.uses > 0);
  }

  get diceOne() { return this.game.diceResult()[0]; }
  get diceTwo() { return this.game.diceResult()[1]; }
  get diceTotal() { return this.diceOne + this.diceTwo; }
}
