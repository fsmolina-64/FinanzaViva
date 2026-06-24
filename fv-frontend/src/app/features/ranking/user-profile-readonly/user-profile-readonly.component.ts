import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { fadeInUp } from '../../../core/animations/animations';
import { environment } from '../../../../environments/environment';

interface Breakdown {
  academic: number;
  simulator: number;
  achievements: number;
  activity: number;
  progress: number;
}

interface UserStats {
  modulesCompleted: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  quizzesPassed: number;
  approvalRate: number;
  gamesPlayed: number;
  gamesWon: number;
  achievementsCount: number;
  rewardsCount: number;
  totalTransactions: number;
  xp: number;
}

interface RankingUser {
  position: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: string;
  level: number;
  currentStreak: number;
  longestStreak: number;
  registeredAt: string;
  score: number;
  streakMultiplier: number;
  breakdown: Breakdown;
  stats: UserStats;
}

@Component({
  selector: 'app-user-profile-readonly',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-readonly.component.html',
  styleUrl: './user-profile-readonly.component.css',
  animations: [
    fadeInUp,
    trigger('barAnimation', [
      transition(':enter', [
        query('.progress-bar', [
          style({ width: '0%' }),
          stagger('80ms', [animate('600ms ease-out', style({ width: '*' }))]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class UserProfileReadonlyComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  userData = signal<RankingUser | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  loaded = signal(false);

  readonly breakdownLabels: { key: keyof Breakdown; label: string; icon: string }[] = [
    { key: 'academic', label: 'Académico', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { key: 'simulator', label: 'Simulador', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'achievements', label: 'Logros', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'activity', label: 'Actividad financiera', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { key: 'progress', label: 'Nivel y XP', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ];

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error.set('Usuario no encontrado.');
      this.loading.set(false);
      return;
    }
    this.http
      .get<RankingUser>(`${environment.apiUrl}/ranking/user/${userId}`)
      .subscribe({
        next: (data) => {
          this.userData.set(data);
          this.loading.set(false);
          setTimeout(() => this.loaded.set(true), 100);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudo cargar el perfil.');
        },
      });
  }

  goBack(): void { this.router.navigate(['/ranking']); }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
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

  multiplierBarClass(mult: number): string {
    if (mult >= 1.3) return 'from-emerald-600 to-emerald-400';
    if (mult >= 1.0) return 'from-sky-600 to-sky-400';
    return 'from-orange-600 to-amber-400';
  }

  multiplierBarWidth(mult: number): number {
    return Math.min(Math.max(((mult - 0.4) / 1.6) * 100, 0), 100);
  }

  multiplierMessage(streak: number, mult: number): string {
    if (streak === 0) return 'Sin racha activa. El puntaje se reduce a 40%.';
    if (mult < 1.0) return `${streak} día${streak > 1 ? 's' : ''} de racha. Sigue para reducir la penalización.`;
    if (streak < 14) return `${streak} días de racha. Faltan ${14 - streak} días para el bono grande.`;
    if (streak < 30) return `${streak} días de racha. Faltan ${30 - streak} días para el bono máximo.`;
    return `${streak} días de racha. Bono máximo activo.`;
  }
}