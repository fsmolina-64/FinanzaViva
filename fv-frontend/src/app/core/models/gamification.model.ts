export type Rank =
  | 'ROOKIE'
  | 'APPRENTICE'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

export interface GamificationStats {
  xp: number;
  level: number;
  rank: Rank;
  streak: number;
  totalXp: number;
}

export interface XpRequest {
  amount: number;
  reason: string;
}

export interface XpResponse {
  xp: number;
  level: number;
  rank: Rank;
  leveledUp: boolean;
}