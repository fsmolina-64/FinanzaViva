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
export type StreakEvent = 'FIRST_STREAK' | 'STREAK_INCREASED' | 'STREAK_RECOVERED' | 'STREAK_LOST';

export interface StreakResponse {
  currentStreak: number;
  streakStatus: StreakStatus | null;
  previousStreak: number;
  streakEvent: StreakEvent | null;
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