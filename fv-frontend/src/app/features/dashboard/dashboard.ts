import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { staggerCards } from '../../core/animations/animations';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { GamificationService } from '../../core/services/gamification.service';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { AchievementService } from '../../core/services/achievement.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { FinanceSummary } from '../../core/models/finance.model';
import { GamificationStats } from '../../core/models/gamification.model';
import { Achievement, Reward } from '../../core/models/achievement.model';

interface UserStatistics {
  totalXpEarned: number;
  quizzesCompleted: number;
  quizzesPassed: number;
  modulesCompleted: number;
  lessonsCompleted: number;
  gamesPlayed: number;
  gamesWon: number;
  totalTransactions: number;
  achievementsCount: number;
  totalQuizzes: number;
  distinctPassedQuizzes: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  animations: [staggerCards]
})
export class Dashboard implements OnInit {

  summary = signal<FinanceSummary | null>(null);
  stats = signal<GamificationStats | null>(null);
  userStats = signal<UserStatistics | null>(null);
  achievements = signal<Achievement[]>([]);
  rewards = signal<Reward[]>([]);
  loading = signal(true);
  rankingPosition = signal<number | null>(null);

  readonly TOTAL_MODULES = 7;
  readonly TOTAL_LESSONS = 28;

  constructor(
    private financeService: FinanceService,
    public gamificationService: GamificationService,
    private achievementService: AchievementService,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.gamificationService.registerStreak().subscribe({
      next: () => { this.loadStats(); this.loadRankingPosition(); },
      error: () => { this.loadStats(); this.loadRankingPosition(); }
    });
    this.loadSummary();
    this.loadUserData();
    this.loadAchievements();
    this.loadRewards();
  }

  private loadRankingPosition(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;
    this.api.get<{ position: number }>('/ranking/user/' + userId).subscribe({
      next: (data) => this.rankingPosition.set(data.position),
      error: () => {}
    });
  }

  private loadStats(): void {
    this.gamificationService.loadStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.toast.error('Error al cargar estadísticas')
    });
  }

  private loadSummary(): void {
    this.financeService.getSummary().subscribe({
      next: (data) => { this.summary.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar resumen financiero'); }
    });
  }

  private loadUserData(): void {
    this.api.get<{ statistics: UserStatistics }>('/users/me').subscribe({
      next: (data) => this.userStats.set(data.statistics),
      error: () => this.toast.error('Error al cargar datos del usuario')
    });
  }

  private loadAchievements(): void {
    this.achievementService.getAchievements().subscribe({
      next: (data) => this.achievements.set(data),
      error: () => this.toast.error('Error al cargar logros')
    });
  }

  private loadRewards(): void {
    this.achievementService.getRewards().subscribe({
      next: (data) => this.rewards.set(data),
      error: () => this.toast.error('Error al cargar recompensas')
    });
  }


  isMaxLevel(): boolean {
    return this.stats()?.rank === 'MASTER';
  }

  getXpProgress(): number {
    if (this.isMaxLevel()) return 100;
    return (this.stats()?.xp ?? 0) % 100;
  }

  getRankLabel(rank: string): string {
    const labels: Record<string, string> = {
      ROOKIE: 'Novato', APPRENTICE: 'Aprendiz', INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado', EXPERT: 'Experto', MASTER: 'Master'
    };
    return labels[rank] ?? rank;
  }


  getQuizApprovalRate(): number {
    const completed = this.userStats()?.quizzesCompleted ?? 0;
    const passed = this.userStats()?.distinctPassedQuizzes ?? 0;
    return completed ? Math.round((passed / completed) * 100) : 0;
  }

  getWinRate(): number {
    const played = this.userStats()?.gamesPlayed ?? 0;
    const won = this.userStats()?.gamesWon ?? 0;
    return played ? Math.round((won / played) * 100) : 0;
  }


  getUnlockedAchievements(): number { return this.userStats()?.achievementsCount ?? 0; }
  getTotalAchievements(): number { return this.achievements().length; }
  getUnlockedRewards(): number { return this.rewards().filter(r => r.unlocked).length; }
  getTotalRewards(): number { return this.rewards().length; }

  getAchievementProgress(): number {
    const total = this.getTotalAchievements();
    return total ? Math.round((this.getUnlockedAchievements() / total) * 100) : 0;
  }

  getRewardProgress(): number {
    const total = this.getTotalRewards();
    return total ? Math.round((this.getUnlockedRewards() / total) * 100) : 0;
  }


  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
  }

  onQuizzesClick(): void {
    this.toast.success('Completa todas las lecciones de un módulo para desbloquear su quiz');
    this.router.navigate(['/academy']);
  }
}