import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { fadeInUp } from '../../core/animations/animations';
import { environment } from '../../../environments/environment';

interface Breakdown {
  activity: number;
  consistency: number;
  academic: number;
  simulator: number;
  achievements: number;
  xp: number;
}

interface RankingUser {
  position: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: string;
  level: number;
  score: number;
  breakdown: Breakdown;
}

interface RankingMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('60ms', [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
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
  limit = 10;

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.loadRanking(1);
  }

  loadRanking(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.loaded.set(false);
    this.http.get<RankingResponse>(`${environment.apiUrl}/ranking`, {
      params: { page: String(page), limit: String(this.limit) },
    }).subscribe({
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
      next: () => {
        this.updating.set(false);
        this.loadRanking(1);
      },
      error: () => {
        this.updating.set(false);
        this.error.set('Error al actualizar el ranking.');
      },
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadRanking(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadRanking(this.currentPage() - 1);
    }
  }

  goToPage(n: number): void {
    if (n !== this.currentPage()) {
      this.loadRanking(n);
    }
  }

  openUserProfile(userId: string): void {
    this.router.navigate(['/ranking/user', userId]);
  }
}
