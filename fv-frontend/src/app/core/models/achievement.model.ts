export type AchievementStatus = 'LOCKED' | 'UNLOCKED';

export type RewardType = 'AVATAR' | 'BORDER' | 'BADGE' | 'TITLE';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  status: AchievementStatus;
  unlockedAt?: string;
  condition: string;
}

export interface Reward {
  id: string;
  name: string;
  type: RewardType;
  imageUrl?: string;
  equipped: boolean;
  unlockedAt: string;
}

export interface EquipRewardResponse {
  reward: Reward;
  previousEquipped?: string;
}