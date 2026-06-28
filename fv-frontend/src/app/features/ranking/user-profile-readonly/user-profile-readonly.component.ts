import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { fadeInUp } from '../../../core/animations/animations';
import { environment } from '../../../../environments/environment';
import { RankLabelPipe } from '../../../shared/pipes/rank-label.pipe';

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
  distinctPassedQuizzes: number;
  approvalRate: number;
  gamesPlayed: number;
  gamesWon: number;
  achievementsCount: number;
  rewardsCount: number;
  totalTransactions: number;
  xp: number;
}

interface EquippedReward {
  id: string; name: string; icon: string; type: string;
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
  equippedBadge: EquippedReward | null;
  equippedTitle: EquippedReward | null;
  equippedFrame: EquippedReward | null;
  equippedAura: EquippedReward | null;
  equippedAvatar: EquippedReward | null;
}

interface StreakTier {
  min: number;
  max: number | null;
  mult: number;
  label: string;
}

interface TierInfo {
  currentMult: number;
  nextMult: number | null;
  daysToNext: number | null;
  progressInTier: number;
  isMax: boolean;
  tierLabel: string;
  tierIdx: number;
}

interface ScoreCategory {
  key: keyof Breakdown;
  label: string;
  weight: number;
  icon: string;
  iconBgClass: string;
  barClass: string;
}

@Component({
  selector: 'app-user-profile-readonly',
  standalone: true,
  imports: [CommonModule, RankLabelPipe],
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

  // ── Caps sincronizados con backend ────────────────────────────────────────
  readonly TOTAL_MODULES = 7;
  readonly TOTAL_LESSONS = 28;
  readonly TOTAL_QUIZZES = 7;
  readonly TOTAL_ACHIEVEMENTS = 23;
  readonly TOTAL_REWARDS = 20;
  readonly CAP_TRANSACTIONS = 200;
  readonly CAP_LEVEL = 10;

  // ── Tiers sincronizados con ranking.service.ts ────────────────────────────
  readonly streakTiers: StreakTier[] = [
    { min: 0, max: 6, mult: 1.00, label: '1–6d' },
    { min: 7, max: 14, mult: 1.10, label: '7–14d' },
    { min: 15, max: 30, mult: 1.20, label: '15–30d' },
    { min: 31, max: 45, mult: 1.40, label: '31–45d' },
    { min: 46, max: 60, mult: 1.60, label: '46–60d' },
    { min: 61, max: 90, mult: 1.80, label: '61–90d' },
    { min: 91, max: null, mult: 2.00, label: '91d+' },
  ];

  readonly scoreCategories: ScoreCategory[] = [
    {
      key: 'academic', label: 'Academia', weight: 35,
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      iconBgClass: 'bg-blue-500/15 text-blue-400',
      barClass: 'from-blue-600 to-blue-400',
    },
    {
      key: 'simulator', label: 'Simulador', weight: 20,
      icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBgClass: 'bg-violet-500/15 text-violet-400',
      barClass: 'from-violet-600 to-violet-400',
    },
    {
      key: 'achievements', label: 'Logros & Recompensas', weight: 20,
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      iconBgClass: 'bg-amber-500/15 text-amber-400',
      barClass: 'from-amber-600 to-amber-400',
    },
    {
      key: 'activity', label: 'Actividad financiera', weight: 15,
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      iconBgClass: 'bg-emerald-500/15 text-emerald-400',
      barClass: 'from-emerald-600 to-emerald-400',
    },
    {
      key: 'progress', label: 'Nivel & XP', weight: 10,
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      iconBgClass: 'bg-sky-500/15 text-sky-400',
      barClass: 'from-sky-600 to-sky-400',
    },
  ];

  // ── Tier derivado de currentStreak (fuente de verdad para la barra) ───────
  tierInfo = computed<TierInfo | null>(() => {
    const user = this.userData();
    if (!user) return null;
    return this.computeTierInfo(user.currentStreak);
  });

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

  winRate(won: number, played: number): number {
    if (played === 0) return 0;
    return Math.round((won / played) * 100);
  }

  // 'progress' usa nivel / 10 para que nivel 7 = 70% visualmente
  categoryBarWidth(key: keyof Breakdown, user: RankingUser): number {
    if (key === 'progress') return Math.min((user.level / this.CAP_LEVEL) * 100, 100);
    return user.breakdown[key];
  }

  // ── Puntos reales por categoría (ponderados) ──────────────────────────────
  round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  categoryPoints(key: keyof Breakdown): number {
    const user = this.userData()!;
    const cat = this.scoreCategories.find(c => c.key === key)!;
    return this.round2(user.breakdown[key] * cat.weight / 100);
  }

  basePoints = computed(() => {
    const user = this.userData();
    if (!user) return 0;
    return this.round2(user.score / user.streakMultiplier);
  });

  // Helper singular/plural reutilizable
  plural(n: number, singular: string, pluralStr: string): string {
    return n === 1 ? `1 ${singular}` : `${n} ${pluralStr}`;
  }

  streakBadgeClass(streak: number): string {
    if (streak === 0) return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    if (streak < 7) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (streak < 30) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  }

  // ── Helpers de multiplicador ──────────────────────────────────────────────

  multiplierColorClass(mult: number): string {
    if (mult >= 1.80) return 'text-emerald-400';
    if (mult >= 1.60) return 'text-sky-400';
    if (mult >= 1.40) return 'text-blue-400';
    if (mult >= 1.20) return 'text-violet-400';
    if (mult >= 1.10) return 'text-amber-400';
    return 'text-muted';
  }

  multiplierBarClass(mult: number): string {
    if (mult >= 1.80) return 'from-emerald-600 to-emerald-400';
    if (mult >= 1.60) return 'from-sky-600 to-sky-400';
    if (mult >= 1.40) return 'from-blue-600 to-blue-400';
    if (mult >= 1.20) return 'from-violet-600 to-violet-400';
    if (mult >= 1.10) return 'from-amber-600 to-amber-400';
    return 'from-slate-600 to-slate-400';
  }

  // Solo describe el estado de la racha. Los "faltan X dias" van en la barra.
  multiplierMessage(streak: number): string {
    if (streak === 0) return 'Sin racha activa. Inicia sesion diariamente para activar el bono.';
    if (streak >= 91) return `${this.plural(streak, 'dia', 'dias')} consecutivos. Multiplicador maximo activo.`;
    return `${this.plural(streak, 'dia', 'dias')} de racha activa.`;
  }

  // "Falta 1 dia" / "Faltan X dias"
  daysToNextLabel(days: number): string {
    return days === 1 ? 'Falta 1 dia' : `Faltan ${days} dias`;
  }

  tierChipClass(tierMult: number, currentMult: number): string {
    if (tierMult === currentMult) return this.activeTierChipClass(tierMult);
    if (tierMult < currentMult) return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    return 'text-muted/40 bg-elevated border-default/10';
  }

  private activeTierChipClass(mult: number): string {
    if (mult >= 1.80) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 font-bold';
    if (mult >= 1.60) return 'text-sky-400 bg-sky-500/15 border-sky-500/30 font-bold';
    if (mult >= 1.40) return 'text-blue-400 bg-blue-500/15 border-blue-500/30 font-bold';
    if (mult >= 1.20) return 'text-violet-400 bg-violet-500/15 border-violet-500/30 font-bold';
    if (mult >= 1.10) return 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold';
    return 'text-slate-300 bg-slate-500/15 border-slate-500/30 font-bold';
  }

  getFrameClass(frame: EquippedReward | null): string {
    if (!frame) return 'border-strong';
    const map: Record<string, string> = {
      '🥉': 'border-amber-700 shadow-amber-700/40 shadow-md',
      '🥈': 'border-muted shadow-muted/40 shadow-md',
      '🥇': 'border-warning shadow-warning/50 shadow-lg',
      '💠': 'border-primary shadow-primary/50 shadow-lg',
    };
    return map[frame.icon] ?? 'border-strong';
  }

  getAuraClass(aura: EquippedReward | null): string {
    if (!aura) return '';
    if (aura.icon === '💙') return 'aura-blue';
    if (aura.icon === '✨') return 'aura-gold';
    if (aura.icon === '🔮') return 'aura-legendary';
    return '';
  }

  private computeTierInfo(streak: number): TierInfo {
    const idx = this.streakTiers.findIndex(
      t => streak >= t.min && (t.max === null || streak <= t.max)
    );
    const tier = this.streakTiers[idx];
    const nextTier = idx < this.streakTiers.length - 1 ? this.streakTiers[idx + 1] : null;

    const isMax = tier.max === null;
    const daysToNext = isMax ? null : tier.max! - streak + 1;
    const progressInTier = isMax
      ? 100
      : Math.round(((streak - tier.min) / (tier.max! - tier.min + 1)) * 100);

    return {
      currentMult: tier.mult,
      nextMult: nextTier?.mult ?? null,
      daysToNext,
      progressInTier,
      isMax,
      tierLabel: tier.label,
      tierIdx: idx,
    };
  }
}