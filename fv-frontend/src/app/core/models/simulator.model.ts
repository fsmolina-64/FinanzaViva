export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
export type GameMode = 'MULTIPLAYER' | 'SOLO' | 'SIMULATION' | 'MIXED';
export type BotPersonality = 'CONSERVATIVE' | 'RISKY' | 'IMPULSIVE' | 'INVESTOR' | 'SAVER';
export type CellType = 'INICIO' | 'PROPERTY' | 'TAX' | 'LOTTERY' | 'WILDCARD' | 'SCAM' | 'PENSION' | 'PENSION_ESPECIAL' | 'JAIL' | 'GO_TO_JAIL';
export type WildcardType = 'POSITIVE' | 'NEGATIVE' | 'GO_TO_JAIL' | 'COLLECT_FROM_ALL' | 'PAY_TO_ALL';
export type GamePhase = 'WAITING' | 'ROLLING' | 'MOVING' | 'ACTION' | 'BUYING' | 'WILDCARD_REVEAL' | 'BETWEEN_TURNS' | 'FINISHED' | 'ABANDONED';
export type ActionType = 'NOTHING' | 'BUY' | 'PAY_RENT' | 'PAY_TAX' | 'LOTTERY' | 'PENSION' | 'WILDCARD' | 'GO_TO_JAIL' | 'SCAM' | 'STAY_IN_JAIL';

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

export interface BoardWildcard {
  id: string;
  text: string;
  type: WildcardType;
  effectAmount: number;
  explanation: string;
}

export interface PlayerProperty {
  id: string;
  gameId: string;
  playerId: string;
  cellPosition: number;
  purchasedAt: string;
}

export interface BackendPlayer {
  id: string;
  gameId: string;
  userId: string | null;
  displayName: string;
  isBot: boolean;
  botPersonality: BotPersonality | null;
  turnOrder: number;
  money: number;
  isEliminated: boolean;
  position: number;
  isInJail: boolean;
  jailTurnsLeft: number;
  hasRolled: boolean;
  properties?: PlayerProperty[];
}

export interface BackendGame {
  id: string;
  createdByUserId: string;
  status: GameStatus;
  mode: GameMode;
  currentRound: number;
  maxRounds: number;
  initialMoney: number;
  gamePhase: GamePhase;
  currentPlayerIdx: number;
  currentDice1: number | null;
  currentDice2: number | null;
  xpRecipientId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  abandonedAt: string | null;
  createdAt: string;
  players?: BackendPlayer[];
}

export interface GameStateResponse {
  game: BackendGame;
  players: BackendPlayer[];
  boardCells: BoardCell[];
  wildcards: BoardWildcard[];
  currentPlayer: BackendPlayer | null;
}

export interface RollDiceResponse {
  dice1: number;
  dice2: number;
  newPosition: number;
  oldPosition: number;
  passedGo: boolean;
  action: ActionType;
  actionDetails: any;
  gameState: GameStateResponse;
}

export interface DecideBuyResponse {
  bought: boolean;
  gameState: GameStateResponse;
}

export interface DismissWildcardResponse {
  wildcardType: WildcardType;
  effectAmount: number;
  moneyChange: number;
  isInJail: boolean;
  gameState: GameStateResponse;
}

export interface HistoryEntry {
  id: string;
  rounds: number;
  maxRounds: number;
  mode: GameMode;
  status: GameStatus;
  playerCount: number;
  humanPlayerCount: number;
  winner: string;
  winnerIsBot: boolean;
  finishedAt: string;
}

export interface CreateGamePayload {
  maxRounds: number;
  mode: GameMode;
  initialMoney?: number;
  humanPlayers: { displayName: string; userId?: string }[];
  botPlayers?: { displayName: string; personality: BotPersonality }[];
  xpRecipientId?: string;
}
