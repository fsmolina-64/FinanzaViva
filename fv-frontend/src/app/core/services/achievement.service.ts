import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Achievement,
  Reward,
  EquipRewardResponse
} from '../models/achievement.model';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  rewards = signal<Reward[]>([]);

  constructor(private api: ApiService) {}

  getAchievements(): Observable<Achievement[]> {
    return this.api.get<Achievement[]>('/achievements');
  }

  getRewards(): Observable<Reward[]> {
    return this.api.get<Reward[]>('/achievements/rewards');
  }

  refreshRewards(): void {
    this.api.get<Reward[]>('/achievements/rewards').subscribe(r => this.rewards.set(r));
  }

  equipReward(id: string): Observable<EquipRewardResponse> {
    return this.api.patch<EquipRewardResponse>(
      `/achievements/rewards/${id}/equip`,
      {}
    );
  }
}