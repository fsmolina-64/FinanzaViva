import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SimulatorService } from '../../../core/services/simulator.service';
import {
  GameStateResponse, RollDiceResponse, DecideBuyResponse,
  DismissWildcardResponse, BackendPlayer, BoardCell, BackendGame,
  PlayerProperty, GamePhase
} from '../../../core/models/simulator.model';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html'
})
export class Game implements OnInit {
  gameState = signal<GameStateResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionLog = signal<string[]>([]);

  dice1 = signal<number | null>(null);
  dice2 = signal<number | null>(null);

  showBuyModal = signal(false);
  buyCell = signal<BoardCell | null>(null);

  showWildcardModal = signal(false);
  wildcardText = signal('');
  wildcardExplanation = signal('');

  showFinishModal = signal(false);

  showTooltip = signal<BoardCell | null>(null);
  tooltipPos = signal({ x: 0, y: 0 });

  gameId!: string;

  game = computed(() => this.gameState()?.game ?? null);
  players = computed(() => this.gameState()?.players ?? []);
  boardCells = computed(() => this.gameState()?.boardCells ?? []);

  currentPlayer = computed(() => {
    const state = this.gameState();
    if (state?.currentPlayer) return state.currentPlayer;
    const g = state?.game;
    const ps = state?.players ?? [];
    if (g && ps.length > 0) return ps[g.currentPlayerIdx] ?? null;
    return null;
  });

  sortedPlayers = computed(() =>
    [...this.players()].sort((a, b) => a.turnOrder - b.turnOrder)
  );

  isMyTurn = computed(() => {
    const cp = this.currentPlayer();
    return cp && !cp.isBot;
  });

  isInJail = computed(() => this.currentPlayer()?.isInJail ?? false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private simulatorService: SimulatorService
  ) {}

  ngOnInit(): void {
    this.gameId = this.route.snapshot.params['id'];
    if (!this.gameId) { this.router.navigate(['/simulator']); return; }
    this.startGame();
  }

  private startGame(): void {
    this.simulatorService.startGame(this.gameId).subscribe({
      next: (state) => {
        this.applyGameState(state);
      },
      error: (err) => {
        if (err?.status === 400) {
          this.simulatorService.getGameState(this.gameId).subscribe({
            next: (state) => this.applyGameState(state),
            error: () => {
              this.error.set('Error al cargar la partida');
              this.loading.set(false);
            }
          });
        } else {
          this.error.set('Error al iniciar la partida');
          this.loading.set(false);
        }
      }
    });
  }

  private applyGameState(state: GameStateResponse): void {
    this.gameState.set(state);
    this.dice1.set(state.game.currentDice1);
    this.dice2.set(state.game.currentDice2);
    this.loading.set(false);

    if (state.game.gamePhase === 'FINISHED') {
      this.showFinishModal.set(true);
    }
  }

  handleStartGame(): void {
    this.simulatorService.startGame(this.gameId).subscribe({
      next: (state) => this.applyGameState(state),
      error: (err) => {
        this.addLog(`Error: ${err?.error?.message ?? 'No se pudo iniciar'}`);
      }
    });
  }

  rollDice(): void {
    this.simulatorService.rollDice(this.gameId).subscribe({
      next: (res) => {
        this.dice1.set(res.dice1);
        this.dice2.set(res.dice2);
        this.gameState.set(res.gameState);
        this.addLog(`\u{1F3B2} ${res.dice1} + ${res.dice2}`);

        if (res.passedGo) {
          this.addLog('Pas\u00f3 por la casilla de INICIO');
        }

        const cell = res.gameState.boardCells.find(c => c.position === res.newPosition);

        switch (res.action) {
          case 'BUY':
            if (cell) {
              this.buyCell.set(cell);
              this.showBuyModal.set(true);
            }
            break;
          case 'WILDCARD':
            this.wildcardText.set(res.actionDetails?.text ?? '');
            this.wildcardExplanation.set(res.actionDetails?.explanation ?? '');
            this.showWildcardModal.set(true);
            break;
          case 'PAY_RENT':
            this.addLog(`Pag\u00f3 renta $${res.actionDetails?.rent ?? 0} a ${res.actionDetails?.ownerName ?? 'desconocido'}`);
            break;
          case 'PAY_TAX':
            this.addLog(`Pag\u00f3 impuesto $${res.actionDetails?.amount ?? 0}`);
            break;
          case 'LOTTERY':
            this.addLog(`Gan\u00f3 la loter\u00eda $${res.actionDetails?.amount ?? 0}`);
            break;
          case 'PENSION':
            this.addLog(`Cobr\u00f3 pensi\u00f3n $${res.actionDetails?.amount ?? 0}`);
            break;
          case 'SCAM':
            this.addLog(`Perdi\u00f3 dinero en estafa $${res.actionDetails?.amount ?? 0}`);
            break;
          case 'GO_TO_JAIL':
            this.addLog('Va a la c\u00e1rcel');
            break;
          case 'STAY_IN_JAIL':
            this.addLog('Permanece en la c\u00e1rcel');
            break;
        }

        if (res.gameState.game.gamePhase === 'FINISHED') {
          this.showFinishModal.set(true);
        }
      },
      error: (err) => {
        this.addLog(`Error: ${err?.error?.message ?? 'Error desconocido'}`);
      }
    });
  }

  decideBuy(buy: boolean): void {
    this.showBuyModal.set(false);
    this.buyCell.set(null);
    this.simulatorService.decideBuy(this.gameId, buy).subscribe({
      next: (res) => {
        this.gameState.set(res.gameState);
        this.dice1.set(res.gameState.game.currentDice1);
        this.dice2.set(res.gameState.game.currentDice2);
        this.addLog(buy ? 'Compr\u00f3 propiedad' : 'Decidi\u00f3 no comprar');
        if (res.gameState.game.gamePhase === 'FINISHED') {
          this.showFinishModal.set(true);
        }
      },
      error: (err) => {
        this.addLog(`Error: ${err?.error?.message ?? 'Error desconocido'}`);
      }
    });
  }

  dismissWildcard(): void {
    this.showWildcardModal.set(false);
    this.simulatorService.dismissWildcard(this.gameId).subscribe({
      next: (res) => {
        this.gameState.set(res.gameState);
        this.dice1.set(res.gameState.game.currentDice1);
        this.dice2.set(res.gameState.game.currentDice2);
        const label = res.wildcardType === 'POSITIVE' ? 'Carta positiva' :
          res.wildcardType === 'NEGATIVE' ? 'Carta negativa' :
          res.wildcardType === 'GO_TO_JAIL' ? 'Carta: va a la c\u00e1rcel' :
          res.wildcardType === 'COLLECT_FROM_ALL' ? 'Carta: cobra a todos' :
          'Carta: paga a todos';
        this.addLog(`${label} ($${res.effectAmount})`);
        if (res.gameState.game.gamePhase === 'FINISHED') {
          this.showFinishModal.set(true);
        }
      },
      error: (err) => {
        this.addLog(`Error: ${err?.error?.message ?? 'Error desconocido'}`);
      }
    });
  }

  endTurn(): void {
    this.dice1.set(null);
    this.dice2.set(null);
    this.simulatorService.endTurn(this.gameId).subscribe({
      next: (res) => {
        this.gameState.set(res);
        this.dice1.set(res.game.currentDice1);
        this.dice2.set(res.game.currentDice2);
        this.addLog('Turno terminado');
        if (res.game.gamePhase === 'FINISHED') {
          this.showFinishModal.set(true);
        }
      },
      error: (err) => {
        this.addLog(`Error: ${err?.error?.message ?? 'Error desconocido'}`);
      }
    });
  }

  abandonGame(): void {
    this.simulatorService.abandonGame(this.gameId).subscribe({
      next: () => this.router.navigate(['/simulator']),
      error: () => this.router.navigate(['/simulator'])
    });
  }

  goToLobby(): void {
    this.router.navigate(['/simulator']);
  }

  getCellByPosition(position: number): BoardCell | undefined {
    return this.boardCells().find(c => c.position === position);
  }

  onCellClick(cell: BoardCell, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      this.tooltipPos.set({ x: rect.left, y: rect.top - 10 });
    } else {
      this.tooltipPos.set({ x: event.clientX, y: event.clientY });
    }
    if (this.showTooltip()?.position === cell.position) {
      this.showTooltip.set(null);
    } else {
      this.showTooltip.set(cell);
    }
  }

  private addLog(msg: string): void {
    const time = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    this.actionLog.update(log => [`${time} ${msg}`, ...log].slice(0, 15));
  }

  getPlayerColor(index: number): string {
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'];
    return colors[index % colors.length];
  }

  getPlayerBorder(index: number): string {
    const colors = ['border-blue-400', 'border-red-400', 'border-green-400', 'border-yellow-400', 'border-purple-400', 'border-pink-400', 'border-cyan-400', 'border-orange-400'];
    return colors[index % colors.length];
  }

  getCellColor(cell: BoardCell): string {
    const groupColors: Record<string, string> = {
      purple: 'bg-purple-600/30 border-purple-500/50',
      blue: 'bg-blue-600/30 border-blue-500/50',
      pink: 'bg-pink-600/30 border-pink-500/50',
      orange: 'bg-orange-600/30 border-orange-500/50',
      red: 'bg-red-600/30 border-red-500/50',
      yellow: 'bg-yellow-600/30 border-yellow-500/50',
      green: 'bg-green-600/30 border-green-500/50',
    };
    if (cell.group && groupColors[cell.group]) return groupColors[cell.group];
    switch (cell.type) {
      case 'INICIO': return 'bg-emerald-600/20 border-emerald-500/40';
      case 'TAX': case 'SCAM': return 'bg-red-600/20 border-red-500/40';
      case 'LOTTERY': case 'PENSION': case 'PENSION_ESPECIAL': return 'bg-yellow-600/20 border-yellow-500/40';
      case 'JAIL': case 'GO_TO_JAIL': return 'bg-strong/30 border-default/50';
      case 'WILDCARD': return 'bg-amber-600/20 border-amber-500/40';
      default: return 'bg-elevated/50 border-strong';
    }
  }

  getCellTopColor(cell: BoardCell): string {
    const groupColors: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
    };
    if (cell.group && groupColors[cell.group]) return groupColors[cell.group];
    switch (cell.type) {
      case 'INICIO': return 'bg-emerald-500';
      case 'TAX': case 'SCAM': return 'bg-red-500';
      case 'LOTTERY': case 'PENSION': case 'PENSION_ESPECIAL': return 'bg-yellow-500';
      case 'JAIL': case 'GO_TO_JAIL': return 'bg-muted';
      case 'WILDCARD': return 'bg-amber-500';
      default: return 'bg-subtle';
    }
  }

  getCellAbbreviation(name: string): string {
    if (name.length <= 10) return name;
    return name.slice(0, 8) + '\u2026';
  }

  getPlayersOnCell(position: number): BackendPlayer[] {
    return this.players().filter(p => p.position === position);
  }

  getOwnerOfCell(cellPosition: number): BackendPlayer | null {
    for (const p of this.players()) {
      if (p.properties?.some(prop => prop.cellPosition === cellPosition)) return p;
    }
    return null;
  }

  getOwnerColor(cellPosition: number): string {
    const owner = this.getOwnerOfCell(cellPosition);
    if (!owner) return '';
    return this.getPlayerColor(owner.turnOrder);
  }

  getPhaseLabel(phase: GamePhase | undefined): string {
    const labels: Record<string, string> = {
      WAITING: 'Esperando jugadores',
      ROLLING: 'Lanzar dados',
      MOVING: 'Moviendo',
      ACTION: 'Acci\u00f3n',
      BUYING: 'Decisi\u00f3n de compra',
      WILDCARD_REVEAL: 'Carta financiera',
      BETWEEN_TURNS: 'Terminar turno',
      FINISHED: 'Partida finalizada',
      ABANDONED: 'Partida abandonada',
    };
    return labels[phase ?? 'WAITING'] ?? 'Desconocido';
  }

  formatMoney(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
  }

  calcXP(): number {
    const g = this.game();
    if (!g?.players?.length) return 0;
    const rank = this.rankedPlayers();
    if (!rank.length) return 0;
    return Math.max(10, Math.round((rank.length - (rank.findIndex(p => !p.isBot) + 1) + 1) / rank.length * 100));
  }

  rankedPlayers(): BackendPlayer[] {
    const ps = this.game()?.players ?? this.players();
    return [...ps].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      return b.money - a.money;
    });
  }

  modeLabel(mode: string | undefined): string {
    const labels: Record<string, string> = {
      SOLO: 'Solo',
      MULTIPLAYER: 'Multijugador',
      MIXED: 'Mixto',
      SIMULATION: 'Observar',
    };
    return labels[mode ?? ''] ?? mode ?? '';
  }
}
