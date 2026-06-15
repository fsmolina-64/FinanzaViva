export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
export type GameMode = 'MULTIPLAYER' | 'SOLO' | 'SIMULATION' | 'MIXED';
export type BotPersonality = 'CONSERVATIVE' | 'RISKY' | 'IMPULSIVE' | 'INVESTOR' | 'SAVER';

export interface BackendConsequence {
  id: string;
  playerId: string;
  description: string;
  effectMoney: number;
  effectIncome: number;
  effectExpenses: number;
  effectScore: number;
  roundsRemaining: number;
}

export interface BackendPlayer {
  id: string;
  gameId: string;
  userId: string | null;
  displayName: string;
  isBot: boolean;
  botPersonality: BotPersonality | null;
  turnOrder: number;
  hasActed: boolean;
  currentEventId: string | null;
  money: number;
  income: number;
  expenses: number;
  debt: number;
  savings: number;
  investments: number;
  assets: number;
  financialScore: number;
  isEliminated: boolean;
  finalRank: number | null;
  consequences?: BackendConsequence[];
}

export interface BackendEventOption {
  id: string;
  eventId: string;
  text: string;
  explanation: string;
  effectMoney: number;
  effectDebt: number;
  effectScore: number;
  effectIncome: number;
  effectExpenses: number;
  effectSavings: number;
  effectAssets: number;
  effectInvestments: number;
  consequenceRounds: number;
  consequenceDesc: string | null;
}

export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  options: BackendEventOption[];
}

export interface BackendGame {
  id: string;
  createdByUserId: string;
  status: GameStatus;
  mode: GameMode;
  currentRound: number;
  maxRounds: number;
  currentPlayerId: string | null;
  xpRecipientId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  players?: BackendPlayer[];
  currentEvent?: BackendEvent | null;
}

export interface DecisionResult {
  explanation: string;
  moneyBefore: number;
  moneyAfter: number;
  moneyChange: number;
  debtBefore: number;
  debtAfter: number;
  debtChange: number;
  scoreBefore: number;
  scoreAfter: number;
  scoreChange: number;
  savingsBefore: number;
  savingsAfter: number;
  investmentsBefore: number;
  investmentsAfter: number;
  incomeAfter: number;
  expensesAfter: number;
  hasConsequence: boolean;
  consequenceDesc: string | null;
  consequenceRounds: number;
}

export interface SubmitDecisionResponse {
  result: DecisionResult;
  gameState: BackendGame;
}

export interface CreateGamePayload {
  maxRounds: number;
  mode: GameMode;
  humanPlayers: { displayName: string; userId?: string }[];
  botPlayers?: { displayName: string; personality: BotPersonality }[];
  xpRecipientId?: string;
}

export interface HistoryEntry {
  id: string;
  rounds: number;
  mode: GameMode;
  playerCount: number;
  finalBalance: number;
  score: number;
  completedAt: string;
}