import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GamificationService } from '../../core/services/gamification.service';
import { FinanceService } from '../../core/services/finance.service';
import { AuthService } from '../../core/services/auth.service';
import { FinanceSummary, BudgetHealth } from '../../core/models/finance.model';
import { GamificationStats } from '../../core/models/gamification.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  summary = signal<FinanceSummary | null>(null);
  health = signal<BudgetHealth | null>(null);
  stats = signal<GamificationStats | null>(null);
  loading = signal(true);

  quickActions = [
    { label: 'Academia',  icon: '📚', path: '/academy',      color: 'from-blue-600 to-blue-400'       },
    { label: 'Quizzes',   icon: '🎯', path: '/quizzes',      color: 'from-emerald-600 to-emerald-400' },
    { label: 'Simulador', icon: '🎮', path: '/simulator',    color: 'from-purple-600 to-purple-400'   },
    { label: 'Logros',    icon: '🏆', path: '/achievements', color: 'from-amber-600 to-amber-400'     },
  ];

  constructor(
    private financeService: FinanceService,
    private gamificationService: GamificationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadSummary();
    this.loadHealth();
  }

  private loadStats(): void {
    this.gamificationService.loadStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {}
    });
  }

  private loadSummary(): void {
    this.financeService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadHealth(): void {
    this.financeService.getBudgetHealth().subscribe({
      next: (data) => this.health.set(data),
      error: () => {}
    });
  }

  getHealthColor(status: string): string {
    const colors: Record<string, string> = {
      HEALTHY:  'text-emerald-400',
      WARNING:  'text-amber-400',
      DANGER:   'text-orange-400',
      CRITICAL: 'text-red-400'
    };
    return colors[status] ?? 'text-slate-400';
  }

  getHealthBarColor(status: string): string {
    const colors: Record<string, string> = {
      HEALTHY:  'from-emerald-500 to-emerald-400',
      WARNING:  'from-amber-500 to-amber-400',
      DANGER:   'from-orange-500 to-orange-400',
      CRITICAL: 'from-red-500 to-red-400'
    };
    return colors[status] ?? 'from-slate-500 to-slate-400';
  }

  getRankLabel(rank: string): string {
    const labels: Record<string, string> = {
      ROOKIE:       'Novato',
      APPRENTICE:   'Aprendiz',
      INTERMEDIATE: 'Intermedio',
      ADVANCED:     'Avanzado',
      EXPERT:       'Experto',
      MASTER:       'Master'
    };
    return labels[rank] ?? rank;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getXpProgress(): number {
    return (this.stats()?.xp ?? 0) % 100;
  }
}