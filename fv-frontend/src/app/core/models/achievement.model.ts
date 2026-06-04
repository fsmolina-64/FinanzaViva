export type RewardType = 'AVATAR' | 'THEME' | 'BADGE' | 'SIMULATOR_EVENT' | 'FRAME';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  condition: { metric: string; threshold: number };
  unlocked: boolean;
  unlockedAt?: string | null;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: RewardType;
  unlockType: string;
  unlockValue: string;
  unlocked: boolean;
  isEquipped: boolean;
}

export interface EquipRewardResponse {
  id: string;
  userId: string;
  rewardId: string;
  isEquipped: boolean;
  unlockedAt: string;
}