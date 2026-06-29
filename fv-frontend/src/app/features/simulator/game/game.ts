import {
  Component, OnInit, OnDestroy, signal, computed, HostListener
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { SimulatorService } from '../../../core/services/simulator.service';
import {
  GameStateResponse, BackendPlayer, BoardCell,
  BotMove
} from '../../../core/models/simulator.model';
import {
  getTokenPos, getPlayersOnCell, cellCol, cellRow, cellSection,
  cellFlexClass, bandIsHorizontal, cellBg, cellBandColor,
  getOwner, cellByPos,
} from './game-board.utils';
import {
  playerHex, playerBg, playerText, playerToken, abbr,
  cellTypeIcon, phaseLabel, modeLabel, fmt, calcXP,
} from './game-display.utils';

interface Toast { id: string; msg: string; type: 'info' | 'success' | 'warning' | 'error'; }

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html',
  styles: [`
    @keyframes diceShake {
      0%,100%{ transform:scale(1) rotate(0deg); }
      20%    { transform:scale(1.25) rotate(-18deg); }
      40%    { transform:scale(0.88) rotate(22deg); }
      60%    { transform:scale(1.18) rotate(-12deg); }
      80%    { transform:scale(0.94) rotate(10deg); }
    }
    .dice-roll { animation: diceShake 0.09s ease-in-out infinite; }

    @keyframes tokenJump {
      0%,100%{ transform:translateY(0) scale(1); }
      45%    { transform:translateY(-9px) scale(1.3); }
    }
    .token-jump { animation: tokenJump 0.27s ease-out; }

    @keyframes toastSlide {
      from { opacity:0; transform:translateX(110%); }
      to   { opacity:1; transform:translateX(0); }
    }
    .toast-in { animation: toastSlide 0.28s ease-out; }

    @keyframes diceReveal {
      0%  { transform:scale(0.6) rotate(-10deg); opacity:0; }
      100%{ transform:scale(1) rotate(0deg);   opacity:1; }
    }
    .dice-reveal { animation: diceReveal 0.25s ease-out; }

    @keyframes countdown {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class Game implements OnInit, OnDestroy {
  gameState = signal<GameStateResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  dice1 = signal<number | null>(null);
  dice2 = signal<number | null>(null);
  isDiceRolling = signal(false);
  diceRevealed = signal(false);

  isAnimating = signal(false);
  animatingId = signal<string | null>(null);
  animatingPos = signal<number>(0);
  bouncingId = signal<string | null>(null);

  showBuyModal = signal(false);
  buyCell = signal<BoardCell | null>(null);
  showWildcardModal = signal(false);
  wildcardText = signal('');
  wildcardExpl = signal('');
  showExitModal = signal(false);
  showTooltip = signal<BoardCell | null>(null);
  tooltipPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  actionLog = signal<string[]>([]);
  showCellExplain = signal<{
    cellName: string;
    description: string;
    impactText: string;
    isPositive: boolean | null;
    cellType: string;
  } | null>(null);

  botMsg = signal<string | null>(null);

  toasts = signal<Toast[]>([]);

  private leaveCallback: ((v: boolean) => void) | null = null;
  private diceInterval: ReturnType<typeof setInterval> | null = null;

  gameId!: string;

  game = computed(() => this.gameState()?.game ?? null);
  players = computed(() => this.gameState()?.players ?? []);
  cells = computed(() => this.gameState()?.boardCells ?? []);

  currentPlayer = computed<BackendPlayer | null>(() => {
    const s = this.gameState();
    if (s?.currentPlayer) return s.currentPlayer;
    const ps = s?.players ?? [];
    const g = s?.game;
    return (g && ps.length) ? (ps[g.currentPlayerIdx] ?? null) : null;
  });

  sortedPlayers = computed(() => [...this.players()].sort((a, b) => a.turnOrder - b.turnOrder));

  rankedPlayers = computed(() => [...this.players()].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return b.money - a.money;
  }));

  isMyTurn = computed(() => {
    const cp = this.currentPlayer();
    return !!(cp && !cp.isBot);
  });

  currentLap = computed(() => {
    const ps = this.players();
    return ps.length ? Math.min(...ps.map(p => p.lapsCompleted ?? 0)) + 1 : 1;
  });

  isGameActive = (): boolean => {
    const ph = this.game()?.gamePhase;
    return !!(ph && ph !== 'WAITING' && ph !== 'FINISHED' && ph !== 'ABANDONED');
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private svc: SimulatorService,
  ) { }

  ngOnInit(): void {
    this.gameState.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.dice1.set(null);
    this.dice2.set(null);
    this.isDiceRolling.set(false);
    this.diceRevealed.set(false);
    this.isAnimating.set(false);
    this.animatingId.set(null);
    this.bouncingId.set(null);
    this.showBuyModal.set(false);
    this.buyCell.set(null);
    this.showWildcardModal.set(false);
    this.wildcardText.set('');
    this.wildcardExpl.set('');
    this.showExitModal.set(false);
    this.showCellExplain.set(null);
    this.toasts.set([]);
    this.botMsg.set(null);

    this.gameId = this.route.snapshot.params['id'];
    if (!this.gameId) { this.router.navigate(['/simulator']); return; }
    this.init();
  }

  ngOnDestroy(): void {
    this.clearDiceInterval();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.isGameActive()) e.preventDefault();
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.isGameActive()) return true;
    this.showExitModal.set(true);
    return new Observable(obs => {
      this.leaveCallback = (v: boolean) => { obs.next(v); obs.complete(); };
    });
  }

  confirmLeave(): void {
    this.showExitModal.set(false);
    this.svc.abandonGame(this.gameId).subscribe({ error: () => { } });
    this.leaveCallback?.(true);
    this.leaveCallback = null;
  }

  cancelLeave(): void {
    this.showExitModal.set(false);
    this.leaveCallback?.(false);
    this.leaveCallback = null;
  }

  private init(): void {
    this.svc.startGame(this.gameId).subscribe({
      next: s => this.applyState(s),
      error: err => {
        if (err?.status === 400) {
          this.svc.getGameState(this.gameId).subscribe({
            next: s => this.applyState(s),
            error: () => { this.error.set('Error al cargar la partida'); this.loading.set(false); },
          });
        } else {
          this.error.set('Error al iniciar la partida');
          this.loading.set(false);
        }
      },
    });
  }

  handleStartGame(): void {
    this.svc.startGame(this.gameId).subscribe({
      next: s => this.applyState(s),
      error: err => this.toast(err?.error?.message ?? 'Error', 'error'),
    });
  }

  private applyState(s: GameStateResponse): void {
    this.gameState.set(s);
    if (!this.isDiceRolling() && !this.isAnimating()) {
      this.dice1.set(s.game.currentDice1 ?? null);
      this.dice2.set(s.game.currentDice2 ?? null);
    }
    this.loading.set(false);
  }

  // ──── Lanzar dados ────────────────────────────────────────────────────

  async rollDice(): Promise<void> {
    if (this.isAnimating() || this.isDiceRolling()) return;

    this.diceRevealed.set(false);
    this.dice1.set(null);
    this.dice2.set(null);
    this.startDiceAnim();

    try {
      const res = await firstValueFrom(this.svc.rollDice(this.gameId));

      await this.delay(700);
      this.stopDiceAnim(res.dice1, res.dice2);
      await this.delay(200);
      this.diceRevealed.set(true);

      const cp = this.currentPlayer();
      if (cp) {
        await this.animateToken(cp.id, cp.position, res.dice1 + res.dice2);
      }

      if (res.passedGo) this.toast('Paso por el INICIO', 'success', 4000);

      const landedCell = res.gameState.boardCells.find(c => c.position === res.newPosition);
      if (landedCell && res.action !== 'BUY' && res.action !== 'WILDCARD' && res.action !== 'NOTHING') {
        const amount = res.actionDetails?.amount ?? res.actionDetails?.rent;
        await this.showCellModal(landedCell, res.action, amount);
      }

      this.applyState(res.gameState);

      switch (res.action) {
        case 'BUY': {
          const cell = res.gameState.boardCells.find(c => c.position === res.newPosition);
          if (cell) { this.buyCell.set(cell); this.showBuyModal.set(true); }
          break;
        }
        case 'WILDCARD':
          this.wildcardText.set(res.actionDetails?.text ?? '');
          this.wildcardExpl.set(res.actionDetails?.explanation ?? '');
          this.showWildcardModal.set(true);
          break;
        case 'PAY_RENT':
          this.toast(`Renta: -${this.fmt(res.actionDetails?.rent ?? 0)} a ${res.actionDetails?.ownerName ?? ''}`, 'warning');
          break;
        case 'PAY_TAX':
          this.toast(`Impuesto: -${this.fmt(res.actionDetails?.amount ?? 0)}`, 'warning');
          break;
        case 'SCAM':
          this.toast(`Estafa: -${this.fmt(res.actionDetails?.amount ?? 0)}`, 'error');
          break;
        case 'LOTTERY':
          this.toast(`Loteria: +${this.fmt(res.actionDetails?.amount ?? 0)}`, 'success');
          break;
        case 'PENSION': case 'PENSION_ESPECIAL':
          this.toast(`Cobrado: +${this.fmt(res.actionDetails?.amount ?? 0)}`, 'success');
          break;
        case 'GO_TO_JAIL':
          this.toast(`${cp?.displayName} va a la carcel`, 'warning');
          break;
      }

    } catch (err: any) {
      this.stopDiceAnim(null, null);
      this.toast(err?.error?.message ?? 'Error al lanzar dados', 'error');
    }
  }

  decideBuy(buy: boolean): void {
    this.showBuyModal.set(false);
    this.buyCell.set(null);
    this.svc.decideBuy(this.gameId, buy).subscribe({
      next: res => {
        this.applyState(res.gameState);
        this.toast(buy ? 'Propiedad comprada' : 'Paso de largo', buy ? 'success' : 'info');
      },
      error: err => this.toast(err?.error?.message ?? 'Error', 'error'),
    });
  }

  dismissWildcard(): void {
    this.showWildcardModal.set(false);
    this.svc.dismissWildcard(this.gameId).subscribe({
      next: res => this.applyState(res.gameState),
      error: err => this.toast(err?.error?.message ?? 'Error', 'error'),
    });
  }

  async endTurn(): Promise<void> {
    this.diceRevealed.set(false);
    this.dice1.set(null);
    this.dice2.set(null);

    try {
      const res = await firstValueFrom(this.svc.endTurn(this.gameId));

      if (res.botMoves?.length) {
        for (const m of res.botMoves) {
          await this.animateBotMove(m, res.gameState.players);
        }
        this.botMsg.set(null);
        this.dice1.set(null);
        this.dice2.set(null);
        this.diceRevealed.set(false);
      }

      this.applyState(res.gameState);

    } catch (err: any) {
      this.toast(err?.error?.message ?? 'Error al terminar turno', 'error');
    }
  }

  abandonGame(): void {
    if (this.isGameActive()) { this.showExitModal.set(true); return; }
    this.router.navigate(['/simulator']);
  }

  goToLobby(): void { this.router.navigate(['/simulator']); }

  // ──── Animacion bot ──────────────────────────────────────────────────

  private async animateBotMove(m: BotMove, currentPlayers: BackendPlayer[]): Promise<void> {
    this.botMsg.set(`${m.playerName} pensando...`);
    await this.delay(800);

    this.botMsg.set(`${m.playerName} lanzando dados...`);
    this.diceRevealed.set(false);
    this.startDiceAnim();
    await this.delay(1000);
    this.stopDiceAnim(m.dice1, m.dice2);
    await this.delay(400);
    this.diceRevealed.set(true);

    this.toast(`${m.playerName}: ${m.dice1} + ${m.dice2} = ${m.diceSum}`, 'info', 3000);
    await this.delay(600);

    const botPlayer = currentPlayers.find(p => p.displayName === m.playerName);
    if (botPlayer) await this.animateToken(botPlayer.id, m.fromPosition, m.diceSum);

    if (m.passedGo) this.toast(`${m.playerName} completo una vuelta`, 'success', 3500);
    if (m.actionDetail) this.toast(`${m.playerName}: ${m.actionDetail}`, 'info', 3500);
    await this.delay(1000);
  }

  private async animateToken(playerId: string, fromPos: number, steps: number): Promise<void> {
    this.isAnimating.set(true);
    this.animatingId.set(playerId);
    this.animatingPos.set(fromPos);

    for (let i = 1; i <= steps; i++) {
      const next = (fromPos + i) % 40;
      this.animatingPos.set(next);
      this.bouncingId.set(playerId);
      await this.delay(380);
      this.bouncingId.set(null);
      await this.delay(20);
    }

    this.animatingId.set(null);
    this.isAnimating.set(false);
  }

  // ──── Dados ──────────────────────────────────────────────────────────

  private startDiceAnim(): void {
    this.isDiceRolling.set(true);
    this.diceInterval = setInterval(() => {
      this.dice1.set(Math.ceil(Math.random() * 6));
      this.dice2.set(Math.ceil(Math.random() * 6));
    }, 80);
  }

  private stopDiceAnim(d1: number | null, d2: number | null): void {
    this.clearDiceInterval();
    this.isDiceRolling.set(false);
    this.dice1.set(d1);
    this.dice2.set(d2);
  }

  private clearDiceInterval(): void {
    if (this.diceInterval) { clearInterval(this.diceInterval); this.diceInterval = null; }
  }

  // ──── Toasts ─────────────────────────────────────────────────────────

  toast(msg: string, type: Toast['type'] = 'info', ms = 3500): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), ms);
  }

  dismissToast(id: string): void { this.toasts.update(t => t.filter(x => x.id !== id)); }

  // ──── Helpers tablero ────────────────────────────────────────────────

  getTokenPos(p: BackendPlayer): number {
    return getTokenPos(p, this.animatingId(), this.animatingPos());
  }

  getPlayersOnCell(pos: number): BackendPlayer[] {
    return getPlayersOnCell(this.players(), pos, this.animatingId(), this.animatingPos());
  }

  cellCol = cellCol;
  cellRow = cellRow;
  cellFlexClass = cellFlexClass;
  bandIsHorizontal = bandIsHorizontal;
  cellBg = cellBg;
  cellBandColor = cellBandColor;
  abbr = abbr;
  cellTypeIcon = cellTypeIcon;
  phaseLabel = phaseLabel;
  modeLabel = modeLabel;
  fmt = fmt;
  playerToken = playerToken;
  playerText = playerText;
  playerHex = playerHex;
  playerBg = playerBg;

  getOwner(pos: number): BackendPlayer | null {
    return getOwner(this.players(), pos);
  }

  cellByPos(pos: number): BoardCell | undefined {
    return cellByPos(this.cells(), pos);
  }

  calcXP(): number {
    return calcXP(this.game()?.maxRounds ?? 5, this.rankedPlayers());
  }

  onCellClick(cell: BoardCell, e: MouseEvent): void {
    if (this.showTooltip()?.position === cell.position) { this.showTooltip.set(null); return; }
    this.tooltipPos.set({ x: e.clientX, y: e.clientY });
    this.showTooltip.set(cell);
  }

  readonly Math = Math;

  private async showCellModal(cell: BoardCell, action: string, amount?: number): Promise<void> {
    let impactText = '';
    let isPositive: boolean | null = null;

    if (amount !== undefined && amount !== 0) {
      if (['LOTTERY', 'PENSION', 'PENSION_ESPECIAL'].includes(action)) {
        impactText = `+${this.fmt(amount)}`;
        isPositive = true;
      } else if (['PAY_TAX', 'SCAM'].includes(action)) {
        impactText = `-${this.fmt(amount)}`;
        isPositive = false;
      } else if (action === 'PAY_RENT') {
        impactText = `-${this.fmt(amount)} (renta)`;
        isPositive = false;
      }
    }

    this.showCellExplain.set({
      cellName: cell.name,
      description: cell.description,
      impactText,
      isPositive,
      cellType: cell.type,
    });

    await this.delay(2500);
    this.showCellExplain.set(null);
  }

  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}
