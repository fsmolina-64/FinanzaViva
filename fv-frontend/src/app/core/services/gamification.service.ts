import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import {
  GamificationStats,
  StreakLog,
  StreakResponse,
  StreakStatus,
  XpRequest,
  XpResponse
} from '../models/gamification.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  stats = signal<GamificationStats | null>(null);
  streakStatus = signal<StreakStatus | null>(null);

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) { }

  loadStats(): Observable<GamificationStats> {
    return this.api.get<GamificationStats>('/gamification/stats').pipe(
      tap(stats => this.stats.set(stats))
    );
  }

  addXp(data: XpRequest): Observable<XpResponse> {
    return this.api.post<XpResponse>('/gamification/xp', data).pipe(
      tap(response => {
        const current = this.stats();
        if (current) {
          this.stats.set({
            ...current,
            xp: response.xp,
            level: response.level,
            rank: response.rank
          });
        }
      })
    );
  }

  registerStreak(): Observable<StreakResponse> {
    return this.api.post<StreakResponse>('/gamification/streak', {}).pipe(
      tap(response => {
        this.streakStatus.set(response.streakStatus);
        const current = this.stats();
        if (current) {
          this.stats.set({ ...current, currentStreak: response.currentStreak });
        }
        switch (response.streakStatus) {
          case 'ACTIVE':
            this.toast.success(`Bienvenido! Tu racha aumentó a ${response.currentStreak} días`);
            break;
          case 'AT_RISK':
            this.toast.success('Llegaste a tiempo! Tu racha se restableció');
            break;
          case 'LOST':
            this.toast.warning('Racha perdida. Empezamos desde cero!');
            break;
        }
      })
    );
  }

  getStreakHistory(month: number, year: number): Observable<StreakLog[]> {
    return this.api.get<StreakLog[]>(
      `/gamification/streak/history?month=${month}&year=${year}`
    );
  }
}