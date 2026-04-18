import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, BOARD_SQUARES, TOTAL_SQUARES, PLAYER_PRESETS } from '../services/game.service';
import { ProfileService } from '../services/profile.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-tablero',
  imports: [CommonModule, FormsModule, Nav],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero {
  game = inject(GameService);
  profile = inject(ProfileService);

  // Setup phase
  setupMode = signal(true);
  numPlayers = signal(2);
  playerNames = signal(['', '', '']);
  playerAvatars = signal(['🚀', '🎯', '⚡']);

  readonly avatarChoices = ['🚀', '🎯', '⚡', '🦊', '🐯', '🦁', '🌟', '🔥', '💎', '🎮'];

  // Board layout - 24 squares in Monopoly order
  // top: 0-7 left→right, right: 8-11 top→bottom, bottom: 12-19 right→left, left: 20-23 bottom→top
  readonly topIds    = [0,1,2,3,4,5,6,7];
  readonly rightIds  = [8,9,10,11];
  readonly bottomIds = [19,18,17,16,15,14,13,12];
  readonly leftIds   = [23,22,21,20];

  getSquare(id: number) { return BOARD_SQUARES[id]; }

  getPlayersAt(id: number) { return this.game.getPlayersAtSquare(id); }

  updatePlayerName(index: number, value: string) {
    this.playerNames.update(names => names.map((name, i) => (i === index ? value : name)));
  }

  updatePlayerAvatar(index: number, avatar: string) {
    this.playerAvatars.update(avatars => avatars.map((current, i) => (i === index ? avatar : current)));
  }

  getOwnerColor(id: number): string | null {
    const ownerIdx = this.game.getPropertyOwner(id);
    if (ownerIdx === null) return null;
    return PLAYER_PRESETS[ownerIdx]?.color ?? null;
  }

  isMovingHere(squareId: number): boolean {
    const mIdx = this.game.movingPlayerIdx();
    if (mIdx < 0) return false;
    return this.game.players()[mIdx]?.position === squareId;
  }

  startGame() {
    const names = this.playerNames().slice(0, this.numPlayers()).map((n, i) => n.trim() || `Jugador ${i + 1}`);
    const avatars = this.playerAvatars().slice(0, this.numPlayers());
    this.game.initGame(names, avatars);
    this.setupMode.set(false);
    this.profile.unlockAchievement('board_lap');
  }

  resetGame() {
    this.game.resetGame();
    this.setupMode.set(true);
  }

  async roll() {
    await this.game.rollAndMove();
  }

  confirmBuy() { this.game.buyCurrentSquare(); }
  skipBuy()    { this.game.skipBuy(); }
  clearEvent() { this.game.clearEvent(); }

  get canRoll(): boolean {
    return !this.game.isRolling() && !this.game.isMoving() && !this.game.pendingEvent() && !this.game.pendingBuy();
  }

  get d1() { return this.game.diceResult()[0]; }
  get d2() { return this.game.diceResult()[1]; }

  typeColor(type: string): string {
    const map: Record<string, string> = {
      start: '#10B981', property: '#6366F1', event: '#F59E0B',
      tax: '#EF4444', bonus: '#10B981', free: '#6B7280',
      jail: '#374151', chance: '#8B5CF6',
    };
    return map[type] ?? '#6B7280';
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      start: 'SALIDA', property: 'PROPIEDAD', event: 'EVENTO',
      tax: 'IMPUESTO', bonus: 'BONO', free: 'LIBRE', jail: 'CÁRCEL', chance: 'SUERTE',
    };
    return map[type] ?? type.toUpperCase();
  }
}
