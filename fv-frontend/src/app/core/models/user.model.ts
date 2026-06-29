export interface UserProfile {
  id: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
  };
  gameStats: {
    id: string;
    userId: string;
    xp: number;
    level: number;
    rank: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: string | null;
    updatedAt: string;
  };
  statistics: {
    id: string;
    userId: string;
    totalXpEarned: number;
    quizzesCompleted: number;
    quizzesPassed: number;
    modulesCompleted: number;
    lessonsCompleted: number;
    gamesPlayed: number;
    gamesWon: number;
    totalTransactions: number;
    achievementsCount: number;
    totalQuizzes: number;
    distinctPassedQuizzes: number;
  };
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}