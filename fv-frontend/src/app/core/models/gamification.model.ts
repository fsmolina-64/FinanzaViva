export type Rank =
  | 'ROOKIE'
  | 'APPRENTICE'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

export interface GamificationStats {
  id: string;
  userId: string;
  xp: number;
  level: number;
  rank: Rank;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  updatedAt: string;
}

export type StreakStatus = 'ACTIVE' | 'AT_RISK' | 'LOST';

export interface StreakResponse {
  currentStreak: number;
  streakStatus: StreakStatus | null;
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

export interface StreakLog {
  id: string;
  date: string;
  streak: number;
  status: StreakStatus;
}