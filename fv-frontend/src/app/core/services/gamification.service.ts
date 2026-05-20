import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  GamificationStats,
  XpRequest,
  XpResponse
} from '../models/gamification.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  stats = signal<GamificationStats | null>(null);

  constructor(private api: ApiService) {}

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

  registerStreak(): Observable<{ streak: number }> {
    return this.api.post<{ streak: number }>('/gamification/streak', {}).pipe(
      tap(response => {
        const current = this.stats();
        if (current) {
          this.stats.set({ ...current, streak: response.streak });
        }
      })
    );
  }
}