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
        switch (response.streakEvent) {
          case 'FIRST_STREAK':
            this.toast.success('¡Bienvenido! Tu racha comenzó. Llevas 1 día.');
            break;
          case 'STREAK_INCREASED':
            this.toast.success(`¡Bienvenido! Tu racha aumentó a ${response.currentStreak} días.`);
            break;
          case 'STREAK_RECOVERED':
            this.toast.success(`¡Volviste justo a tiempo! Tu racha se descongeló y continúa en ${response.currentStreak} días.`);
            break;
          case 'STREAK_LOST':
            this.toast.warning('Perdiste tu racha. Pero no te rindas — hoy comienzas de nuevo. ¡Día 1!');
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