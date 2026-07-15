import {
  Component, OnInit, OnDestroy, signal, computed, HostListener
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { SimulatorService } from '../../../core/services/simulator.service';
import { GamificationService } from '../../../core/services/gamification.service';
import {
  GameStateResponse, BackendPlayer, BoardCell,
  BotMove, DecisionOption, DecideOptionResponse,
} from '../../../core/models/simulator.model';
import {
  getTokenPos, getPlayersOnCell, cellCol, cellRow, cellSection,
  cellFlexClass, bandIsHorizontal, cellBg, cellBandColor,
  getOwner, cellByPos, getBandPositionClass,
} from './game-board.utils';
import {
  playerHex, playerBg, playerText, playerToken, abbr,
  cellTypeIcon, phaseLabel, modeLabel, fmt, calcXP,
  fichaImg, healthPercent, healthColor, diceDots, playerRgba,
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
      100%{ transform:scale(1) rotate(0deg); opacity:1; }
    }
    .dice-reveal { animation: diceReveal 0.25s ease-out; }

    @keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
      100% { transform: translateY(110vh) rotate(680deg) scale(0.6); opacity: 0; }
    }

    @keyframes cellLanded {
      0%, 100% { box-shadow: 0 0 0 0px rgba(99,102,241,0); }
      30%, 70% { box-shadow: 0 0 0 5px rgba(99,102,241,0.55), inset 0 0 8px rgba(99,102,241,0.2); }
    }
    .cell-landed { animation: cellLanded 0.9s ease-in-out 2; z-index: 20; }

    @keyframes modalReveal {
      from { transform: scale(0.82) translateY(-12px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
    .modal-reveal { animation: modalReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
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
  showDecisionModal = signal(false);
  showDecisionResult = signal(false);
  decisionOptions = signal<DecisionOption[]>([]);
  decisionCellDesc = signal('');
  decisionResult = signal<{ correct: boolean; amount: number; explanation: string } | null>(null);
  showExitModal = signal(false);
  showTooltip = signal<BoardCell | null>(null);
  tooltipPos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  actionLog = signal<string[]>([]);
  landedCellPos = signal<number | null>(null);
  confettiParticles = signal<Array<{ left: string; color: string; delay: string; dur: string }>>([]);
  showCellExplain = signal<{
    cellName: string;
    description: string;
    impactText: string;
    isPositive: boolean | null;
    cellType: string;
  } | null>(null);

  botMsg = signal<string | null>(null);

  toasts = signal<Toast[]>([]);

  isSimulating = signal(false);
  isLeaving = signal(false);
  simSpeed = signal<'normal' | 'fast'>('normal');
  eliminatedCount = computed(() => this.players().filter(p => p.isEliminated).length);
  private simulationActive = false;

  private readonly TIMING = {
    DICE_RESULT_DELAY: 350,
    DICE_REVEAL_DELAY: 100,
    TOKEN_STEP_NORMAL: 260,
    TOKEN_STEP_FAST: 75,
    BOT_THINK: 500,
    BOT_ROLL: 650,
    BOT_POST_ROLL: 250,
    BOT_RESULT_TOAST: 400,
    BOT_TURN_END: 600,
  };

  private leaveCallback: ((v: boolean) => void) | null = null;
  private diceInterval: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

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
    const ps = this.players().filter(p => !p.isEliminated);
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
    private gamificationService: GamificationService
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
    this.destroyed = true;
    this.clearDiceInterval();
    this.simulationActive = false;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.isGameActive()) { e.preventDefault(); e.returnValue = ''; }
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.isGameActive()) return true;
    this.showExitModal.set(true);
    return new Observable(obs => {
      this.leaveCallback = (v: boolean) => { obs.next(v); obs.complete(); };
    });
  }

  confirmLeave(): void {
    this.simulationActive = false;
    this.isLeaving.set(true);

    this.svc.abandonGame(this.gameId).subscribe({
      next: () => {
        this.showExitModal.set(false);
        this.isLeaving.set(false);
        this.leaveCallback?.(true);
        this.leaveCallback = null;
      },
      error: (err) => {
        this.showExitModal.set(false);
        this.isLeaving.set(false);
        this.leaveCallback?.(true);
        this.leaveCallback = null;
        this.toast(err?.error?.message ?? 'Error al abandonar la partida', 'error');
      },
    });
  }

  cancelLeave(): void {
    if (this.isLeaving()) return;
    this.showExitModal.set(false);
    this.leaveCallback?.(false);
    this.leaveCallback = null;
  }

  private init(): void {
    this.svc.startGame(this.gameId).subscribe({
      next: s => {
        this.applyState(s);
        if (s.game.mode === 'SIMULATION' && s.game.status === 'IN_PROGRESS') this.runObserverLoop();
      },
      error: err => {
        if (err?.status === 400) {
          this.svc.getGameState(this.gameId).subscribe({
            next: s => {
              this.applyState(s);
              if (s.game.mode === 'SIMULATION' && s.game.status === 'IN_PROGRESS') this.runObserverLoop();
            },
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
      next: s => {
        this.applyState(s);
        if (s.game.mode === 'SIMULATION' && s.game.status === 'IN_PROGRESS') this.runObserverLoop();
      },
      error: err => this.toast(err?.error?.message ?? 'Error', 'error'),
    });
  }

  private applyState(s: GameStateResponse): void {
    const prevPhase = this.game()?.gamePhase;
    this.gameState.set(s);
    if (!this.isDiceRolling() && !this.isAnimating()) {
      this.dice1.set(s.game.currentDice1 ?? null);
      this.dice2.set(s.game.currentDice2 ?? null);
    }
    this.loading.set(false);
    if (prevPhase !== 'FINISHED' && s.game.gamePhase === 'FINISHED' && s.game.mode !== 'SIMULATION') {
      this.generateConfetti();
      this.gamificationService.loadStats().subscribe();
    }
  }


  async rollDice(): Promise<void> {
    if (this.isAnimating() || this.isDiceRolling()) return;

    this.diceRevealed.set(false);
    this.dice1.set(null);
    this.dice2.set(null);
    this.startDiceAnim();

    try {
      const res = await firstValueFrom(this.svc.rollDice(this.gameId));

      await this.delay(this.TIMING.DICE_RESULT_DELAY);
      this.stopDiceAnim(res.dice1, res.dice2);
      await this.delay(this.TIMING.DICE_REVEAL_DELAY);
      this.diceRevealed.set(true);

      const cp = this.currentPlayer();
      const playerName = cp?.displayName ?? '?';
      this.addToLog(`${playerName}: ${res.dice1}+${res.dice2}=${res.dice1 + res.dice2}`);

      if (cp) {
        await this.animateToken(cp.id, cp.position, res.dice1 + res.dice2);
      }
      this.setLandedCell(res.newPosition);

      if (res.passedGo) {
        this.toast('Paso por el INICIO', 'success', 4000);
        this.addToLog(`${playerName} completo una vuelta`);
      }

      const landedCell = res.gameState.boardCells.find(c => c.position === res.newPosition);
      if (landedCell && !['BUY', 'WILDCARD', 'NOTHING', 'DECISION', 'STAY_IN_JAIL'].includes(res.action)) {
        const amount = res.actionDetails?.amount ?? res.actionDetails?.rent;
        await this.showCellModal(landedCell, res.action, amount);
      }

      this.applyState(res.gameState);

      switch (res.action) {
        case 'BUY': {
          const cell = res.gameState.boardCells.find(c => c.position === res.newPosition);
          if (cell) {
            this.buyCell.set(cell);
            this.showBuyModal.set(true);
            this.addToLog(`${playerName} puede comprar ${cell.name}`);
          }
          break;
        }
        case 'WILDCARD':
          this.wildcardText.set(res.actionDetails?.text ?? '');
          this.wildcardExpl.set(res.actionDetails?.explanation ?? '');
          this.showWildcardModal.set(true);
          this.addToLog(`${playerName} saco carta comodin`);
          break;
        case 'PAY_RENT':
          this.toast(`Renta: -${this.fmt(res.actionDetails?.rent ?? 0)} a ${res.actionDetails?.ownerName ?? ''}`, 'warning');
          this.addToLog(`${playerName} pago $${res.actionDetails?.rent ?? 0} de renta a ${res.actionDetails?.ownerName ?? '?'}`);
          break;
        case 'PAY_TAX':
          this.toast(`Impuesto: -${this.fmt(res.actionDetails?.amount ?? 0)}`, 'warning');
          this.addToLog(`${playerName} pago $${res.actionDetails?.amount ?? 0} de impuesto`);
          break;
        case 'SCAM':
          this.toast(`Estafa: -${this.fmt(res.actionDetails?.amount ?? 0)}`, 'error');
          this.addToLog(`${playerName} cayo en estafa -$${res.actionDetails?.amount ?? 0}`);
          break;
        case 'LOTTERY':
          this.toast(`Loteria: +${this.fmt(res.actionDetails?.amount ?? 0)}`, 'success');
          this.addToLog(`${playerName} gano $${res.actionDetails?.amount ?? 0} en loteria`);
          break;
        case 'PENSION':
        case 'PENSION_ESPECIAL':
          this.toast(`Cobrado: +${this.fmt(res.actionDetails?.amount ?? 0)}`, 'success');
          this.addToLog(`${playerName} cobro $${res.actionDetails?.amount ?? 0}`);
          break;
        case 'GO_TO_JAIL':
          this.toast(`${playerName} va a la carcel`, 'warning');
          this.addToLog(`${playerName} fue enviado a la carcel`);
          break;
        case 'STAY_IN_JAIL':
          this.toast(`${playerName} sigue en la carcel`, 'warning');
          this.addToLog(`${playerName} sigue en carcel`);
          break;
        case 'DECISION':
          this.decisionOptions.set(res.actionDetails?.options ?? []);
          this.decisionCellDesc.set(res.actionDetails?.cellDescription ?? '');
          this.decisionResult.set(null);
          this.showDecisionModal.set(true);
          this.addToLog(`${playerName} enfrenta una decision financiera`);
          break;
        case 'EDUCATIONAL':
          this.toast(`Leccion financiera: +${this.fmt(res.actionDetails?.amount ?? 0)}`, 'success');
          this.addToLog(`${playerName} aprendio: ${landedCell?.name ?? '?'} +$${res.actionDetails?.amount ?? 0}`);
          break;
      }

    } catch (err: any) {
      this.stopDiceAnim(null, null);
      this.toast(err?.error?.message ?? 'Error al lanzar dados', 'error');
    } finally {
      this.animatingId.set(null);
      this.isAnimating.set(false);
    }
  }

  decideBuy(buy: boolean): void {
    const cellName = this.buyCell()?.name ?? '?';
    const playerName = this.currentPlayer()?.displayName ?? '?';
    this.showBuyModal.set(false);
    this.buyCell.set(null);
    this.svc.decideBuy(this.gameId, buy).subscribe({
      next: res => {
        this.applyState(res.gameState);
        if (buy) {
          this.toast('Propiedad comprada', 'success');
          this.addToLog(`${playerName} compro ${cellName}`);
        } else {
          this.toast('Paso de largo', 'info');
          this.addToLog(`${playerName} no compro ${cellName}`);
        }
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
    } finally {
      this.animatingId.set(null);
      this.isAnimating.set(false);
    }
  }

  abandonGame(): void {
    if (this.isGameActive()) { this.showExitModal.set(true); return; }
    this.router.navigate(['/simulator']);
  }

  private async runObserverLoop(): Promise<void> {
    if (this.simulationActive) return;
    this.simulationActive = true;
    this.isSimulating.set(true);

    while (this.simulationActive && !this.destroyed) {
      let res;
      try {
        res = await firstValueFrom(this.svc.botStep(this.gameId));
      } catch (err: any) {
        this.toast(err?.error?.message ?? 'Error al avanzar la simulacion', 'error');
        break;
      }

      if (this.destroyed) break;
      if (res.botMove) await this.animateBotMove(res.botMove, res.gameState.players);
      if (this.destroyed) break;
      this.applyState(res.gameState);
      this.animatingId.set(null);
      this.isAnimating.set(false);
      if (res.finished) break;
      await this.delay(200);
    }

    this.botMsg.set(null);
    this.isSimulating.set(false);
    this.simulationActive = false;
  }

  pickDecisionOption(optionId: string): void {
    this.showDecisionModal.set(false);
    this.svc.decideOption(this.gameId, optionId).subscribe({
      next: res => {
        this.decisionResult.set({
          correct: res.correct,
          amount: res.amount,
          explanation: res.explanation,
        });
        this.showDecisionResult.set(true);
        this.applyState(res.gameState);
        const msg = res.correct
          ? `Buena decision! +${this.fmt(res.amount)}`
          : `Decision incorrecta ${this.fmt(res.amount)}`;
        this.toast(msg, res.correct ? 'success' : 'error', 5000);
        this.addToLog(msg);
      },
      error: err => {
        this.showDecisionModal.set(true);
        this.toast(err?.error?.message ?? 'Error al procesar decision', 'error');
      },
    });
  }

  closeDecisionResult(): void {
    this.showDecisionResult.set(false);
  }

  goToLobby(): void { this.router.navigate(['/simulator']); }


  private async animateBotMove(m: BotMove, currentPlayers: BackendPlayer[]): Promise<void> {
    const fast = this.simSpeed() === 'fast';
    const d = (ms: number) => this.delay(fast ? Math.round(ms * 0.28) : ms);

    this.botMsg.set(`${m.playerName} pensando...`);
    await d(this.TIMING.BOT_THINK);

    this.botMsg.set(`${m.playerName} lanzando dados...`);
    this.diceRevealed.set(false);
    this.startDiceAnim();
    await d(this.TIMING.BOT_ROLL);
    this.stopDiceAnim(m.dice1, m.dice2);
    await d(this.TIMING.BOT_POST_ROLL);
    this.diceRevealed.set(true);

    this.toast(`${m.playerName}: ${m.dice1} + ${m.dice2} = ${m.diceSum}`, 'info', fast ? 1500 : 3000);
    await d(this.TIMING.BOT_RESULT_TOAST);

    const botPlayer = currentPlayers.find(p => p.displayName === m.playerName);
    if (botPlayer) await this.animateToken(botPlayer.id, m.fromPosition, m.diceSum);

    this.setLandedCell(m.toPosition);

    if (m.passedGo) this.toast(`${m.playerName} completo una vuelta`, 'success', fast ? 1200 : 3500);
    if (m.actionDetail) {
      this.toast(`${m.playerName}: ${m.actionDetail}`, 'info', fast ? 1200 : 3500);
      this.addToLog(m.actionDetail);
    }
    await d(this.TIMING.BOT_TURN_END);
  }

  private async animateToken(playerId: string, fromPos: number, steps: number): Promise<void> {
    this.isAnimating.set(true);
    this.animatingId.set(playerId);
    this.animatingPos.set(fromPos);

    const fast = this.simSpeed() === 'fast';
    const stepMs = fast ? this.TIMING.TOKEN_STEP_FAST : this.TIMING.TOKEN_STEP_NORMAL;

    for (let i = 1; i <= steps; i++) {
      const next = (fromPos + i) % 40;
      this.animatingPos.set(next);
      this.bouncingId.set(playerId);
      await this.delay(stepMs);
      this.bouncingId.set(null);
      await this.delay(10);
    }
  }


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


  toast(msg: string, type: Toast['type'] = 'info', ms = 3500): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, msg, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), ms);
  }

  dismissToast(id: string): void { this.toasts.update(t => t.filter(x => x.id !== id)); }


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
  fichaImg = fichaImg;
  healthPercent = healthPercent;
  healthColor = healthColor;
  diceDots = diceDots;
  playerRgba = playerRgba;

  getOwner(pos: number): BackendPlayer | null {
    return getOwner(this.players(), pos);
  }

  cellByPos(pos: number): BoardCell | undefined {
    return cellByPos(this.cells(), pos);
  }

  getBandClass = getBandPositionClass;

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
      if (['LOTTERY', 'PENSION', 'PENSION_ESPECIAL', 'EDUCATIONAL'].includes(action)) {
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

  private addToLog(entry: string): void {
    const t = new Date();
    const stamp = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    this.actionLog.update(log => [`[${stamp}] ${entry}`, ...log].slice(0, 30));
  }

  private setLandedCell(pos: number): void {
    this.landedCellPos.set(pos);
    setTimeout(() => {
      if (!this.destroyed && this.landedCellPos() === pos) this.landedCellPos.set(null);
    }, 2400);
  }

  private generateConfetti(): void {
    const colors = ['#3B82F6', '#10B981', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    this.confettiParticles.set(
      Array.from({ length: 48 }, () => ({
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: `${(Math.random() * 1.8).toFixed(2)}s`,
        dur: `${(2.2 + Math.random() * 2.2).toFixed(2)}s`,
      }))
    );
    setTimeout(() => { if (!this.destroyed) this.confettiParticles.set([]); }, 6500);
  }

  private delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}
