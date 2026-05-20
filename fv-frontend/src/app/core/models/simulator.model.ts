export type GameStatus = 'PENDING' | 'ACTIVE' | 'FINISHED';

export interface DecisionOption {
  id: string;
  text: string;
  impact: string;
}

export interface SimulatorEvent {
  id: string;
  title: string;
  description: string;
  options: DecisionOption[];
}

export interface SimulatorGame {
  id: string;
  status: GameStatus;
  round: number;
  totalRounds: number;
  balance: number;
  score: number;
  createdAt: string;
}

export interface SimulatorGameDetail extends SimulatorGame {
  currentEvent?: SimulatorEvent;
  history: SimulatorRoundResult[];
}

export interface SimulatorRoundResult {
  round: number;
  eventTitle: string;
  decisionText: string;
  balanceChange: number;
  newBalance: number;
  feedback: string;
}

export interface SimulatorDecision {
  optionId: string;
}

export interface SimulatorHistoryEntry {
  id: string;
  score: number;
  rounds: number;
  finalBalance: number;
  completedAt: string;
}