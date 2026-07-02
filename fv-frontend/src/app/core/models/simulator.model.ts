export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
export type GamePhase =
  | 'WAITING' | 'ROLLING' | 'MOVING' | 'ACTION'
  | 'BUYING' | 'WILDCARD_REVEAL' | 'DECISION_PENDING' | 'BETWEEN_TURNS'
  | 'FINISHED' | 'ABANDONED';
export type GameMode = 'SOLO' | 'MULTIPLAYER' | 'MIXED' | 'SIMULATION';
export type BotPersonality = 'CONSERVATIVE' | 'RISKY' | 'IMPULSIVE' | 'INVESTOR' | 'SAVER';
export type CellType =
  | 'INICIO' | 'PROPERTY' | 'TAX' | 'LOTTERY'
  | 'WILDCARD' | 'SCAM' | 'PENSION' | 'PENSION_ESPECIAL'
  | 'JAIL' | 'GO_TO_JAIL'
  | 'DECISION'
  | 'EDUCATIONAL';

export interface PlayerProperty {
  id: string;
  cellPosition: number;
}

export interface BackendPlayer {
  id: string;
  gameId: string;
  userId: string | null;
  displayName: string;
  isBot: boolean;
  botPersonality: BotPersonality | null;
  turnOrder: number;
  hasRolled: boolean;
  position: number;
  money: number;
  isInJail: boolean;
  jailTurnsLeft: number;
  isEliminated: boolean;
  finalRank: number | null;
  lapsCompleted: number;
  tokenSymbol: string;
  properties?: PlayerProperty[];
}

export interface BoardCell {
  position: number;
  name: string;
  type: CellType;
  group: string | null;
  price: number | null;
  rent: number | null;
  amount: number | null;
  description: string;
}

export interface BackendGame {
  id: string;
  createdByUserId: string;
  status: GameStatus;
  gamePhase: GamePhase;
  mode: GameMode;
  currentRound: number;
  maxRounds: number;
  currentPlayerIdx: number;
  currentDice1: number | null;
  currentDice2: number | null;
  initialMoney: number;
  xpRecipientId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  players?: BackendPlayer[];
}

export interface GameStateResponse {
  game: BackendGame;
  players: BackendPlayer[];
  boardCells: BoardCell[];
  currentPlayer: BackendPlayer | null;
}

export interface RollDiceResponse {
  dice1: number;
  dice2: number;
  newPosition: number;
  passedGo: boolean;
  action: string;
  actionDetails: {
    rent?: number;
    ownerName?: string;
    amount?: number;
    text?: string;
    explanation?: string;
    options?: DecisionOption[];
    cellDescription?: string;
  } | null;
  gameState: GameStateResponse;
}

export interface DecideBuyResponse {
  bought: boolean;
  gameState: GameStateResponse;
}

export interface DismissWildcardResponse {
  wildcardType: string;
  effectAmount: number;
  gameState: GameStateResponse;
}

export interface DecisionOption {
  id: string;
  text: string;
}

export interface DecideOptionResponse {
  correct: boolean;
  amount: number;
  explanation: string;
  playerMoney: number;
  gameState: GameStateResponse;
}

export interface BotMove {
  playerName: string;
  dice1: number;
  dice2: number;
  diceSum: number;
  fromPosition: number;
  toPosition: number;
  passedGo: boolean;
  action: string;
  actionDetail: string;
}

export interface EndTurnResponse {
  gameState: GameStateResponse;
  botMoves: BotMove[];
}

export interface CreateGamePayload {
  maxRounds: number;
  mode: GameMode;
  initialMoney?: number;
  humanPlayers: { displayName: string; tokenSymbol?: string }[];
  botPlayers?: { displayName: string; personality: BotPersonality; tokenSymbol?: string }[];
  xpRecipientId?: string;
}

export interface BackendPlayerExtended extends BackendPlayer {
  tokenSymbol: string;
}

export interface HistoryEntry {
  id: string;
  rounds: number;
  mode: GameMode;
  status: string;
  humanPlayerCount: number;
  botPlayerCount: number;
  initialMoney: number;
  winner: string;
  finishedAt: string;
}
