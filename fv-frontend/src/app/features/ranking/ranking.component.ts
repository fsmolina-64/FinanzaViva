import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { fadeInUp } from '../../core/animations/animations';
import { environment } from '../../../environments/environment';

interface Breakdown {
  academic: number;
  simulator: number;
  achievements: number;
  activity: number;
  progress: number;
}

interface RankingUser {
  position: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: string;
  level: number;
  currentStreak: number;
  registeredAt: string;
  score: number;
  streakMultiplier: number;
  breakdown: Breakdown;
}

interface RankingMeta {
  total: number; page: number; limit: number; totalPages: number;
}

interface RankingResponse {
  data: RankingUser[];
  meta: RankingMeta;
}

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
  animations: [
    fadeInUp,
    trigger('staggerRows', [
      transition(':enter', [
        query('.ranking-row', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger('50ms', [animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class RankingComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  rankingData = signal<RankingUser[]>([]);
  loading = signal(true);
  updating = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalUsers = signal(0);
  loaded = signal(false);
  readonly limit = 10;

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  });

  ngOnInit(): void { this.loadRanking(1); }

  loadRanking(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.loaded.set(false);
    this.http
      .get<RankingResponse>(`${environment.apiUrl}/ranking`, {
        params: { page: String(page), limit: String(this.limit) },
      })
      .subscribe({
        next: (res) => {
          this.rankingData.set(res.data);
          this.currentPage.set(res.meta.page);
          this.totalPages.set(res.meta.totalPages);
          this.totalUsers.set(res.meta.total);
          this.loading.set(false);
          setTimeout(() => this.loaded.set(true), 50);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudo cargar el ranking. Intenta de nuevo.');
        },
      });
  }

  updateRanking(): void {
    this.updating.set(true);
    this.http.post<{ updated: number }>(`${environment.apiUrl}/ranking/update`, {}).subscribe({
      next: () => { this.updating.set(false); this.loadRanking(1); },
      error: () => { this.updating.set(false); this.error.set('Error al actualizar el ranking.'); },
    });
  }

  nextPage(): void { if (this.currentPage() < this.totalPages()) this.loadRanking(this.currentPage() + 1); }
  prevPage(): void { if (this.currentPage() > 1) this.loadRanking(this.currentPage() - 1); }
  goToPage(n: number): void { if (n !== this.currentPage()) this.loadRanking(n); }
  openUserProfile(userId: string): void { this.router.navigate(['/ranking/user', userId]); }

  formatRegisteredDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }

  // Devuelven clases de Tailwind — sin lógica en template
  positionClass(pos: number): string {
    if (pos === 1) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (pos === 2) return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    if (pos === 3) return 'bg-amber-700/20 text-amber-600 border border-amber-700/30';
    return 'bg-elevated text-muted';
  }

  streakBadgeClass(streak: number): string {
    if (streak === 0) return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    if (streak < 7) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (streak < 30) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  }

  multiplierBadgeClass(mult: number): string {
    if (mult >= 1.3) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (mult >= 1.0) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  }
}