export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';

export interface BackendPlayer {
  id: string;
  gameId: string;
  userId: string | null;
  displayName: string;
  money: number;
  income: number;
  expenses: number;
  debt: number;
  financialScore: number;
  isEliminated: boolean;
  finalRank: number | null;
}

export interface BackendGame {
  id: string;
  createdByUserId: string;
  status: GameStatus;
  currentRound: number;
  maxRounds: number;
  roundType: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  players?: BackendPlayer[];
}

export interface BackendEventOption {
  id: string;
  eventId: string;
  text: string;
  explanation: string;
  effectMoney: number;
  effectDebt: number;
  effectScore: number;
}

export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  options: BackendEventOption[];
}

export interface CreateGamePayload {
  maxRounds: number;
  roundType: string;
  players: { displayName: string; userId?: string }[];
}

export interface SubmitDecisionPayload {
  playerId: string;
  eventId: string;
  chosenOptionId: string;
}

export interface DecisionResult {
  explanation: string;
  moneyBefore: number;
  moneyAfter: number;
  debtBefore: number;
  debtAfter: number;
  scoreBefore: number;
  scoreAfter: number;
}


export interface PlayerState {
  name: string;
  gameId: string;
  playerId: string;
  currentMoney: number;
  currentDebt: number;
  currentScore: number;
  finalScore?: number;
  finalBalance?: number;
}


export interface HistoryEntry {
  id: string;
  rounds: number;
  finalBalance: number;
  score: number;
  completedAt: string;
}