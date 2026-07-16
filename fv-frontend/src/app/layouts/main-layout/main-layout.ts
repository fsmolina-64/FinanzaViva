import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { GamificationService } from '../../core/services/gamification.service';
import { AchievementService } from '../../core/services/achievement.service';
import { RewardVisualsService } from '../../core/services/reward-visuals.service';
import { ToastService } from '../../core/services/toast.service';
import { Reward } from '../../core/models/achievement.model';
import { RANK_LABEL_MAP } from '../../core/constants/rank-label.const';
import { getRankColors } from '../../core/constants/rank-colors.const';
import { ToastComponent } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule, CommonModule, ToastComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  sidebarOpen = signal(true);
  deletionScheduledAt = signal<string | null>(null);
  cancelingDeletion = signal(false);

  equippedAvatar = computed(() => this.achievementService.rewards().find(r => r.type === 'AVATAR' && r.isEquipped) ?? null);
  equippedFrame = computed(() => this.achievementService.rewards().find(r => r.type === 'FRAME' && r.isEquipped) ?? null);
  equippedBadge = computed(() => this.achievementService.rewards().find(r => r.type === 'BADGE' && r.isEquipped) ?? null);
  equippedAura = computed(() => this.achievementService.rewards().find(r => r.type === 'AURA' && r.isEquipped) ?? null);

  daysUntilDeletion = computed(() => {
    const scheduled = this.deletionScheduledAt();
    if (!scheduled) return 0;
    const diff = new Date(scheduled).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  navItems = [
    { path: '/dashboard', icon: 'dashboard.png', label: 'Dashboard' },
    { path: '/finances', icon: 'billetera-premium.png', label: 'Finanzas' },
    { path: '/academy', icon: 'academia.png', label: 'Academia' },
    { path: '/simulator', icon: 'simulador.png', label: 'Simulador' },
    { path: '/achievements', icon: 'logro.png', label: 'Logros' },
    { path: '/ranking', icon: '/ranking.png', label: 'Ranking' },
    { path: '/profile', icon: 'perfil.png', label: 'Perfil' },
  ];

  constructor(
    public authService: AuthService,
    public gamificationService: GamificationService,
    private userService: UserService,
    private achievementService: AchievementService,
    private rewardVisuals: RewardVisualsService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    if (this.authService.currentUser()) {
      this.gamificationService.loadStats().subscribe();
      this.userService.getProfile().subscribe({
        next: p => {
          this.authService.refreshProfile(p.profile);
          this.deletionScheduledAt.set(p.deletionScheduledAt ?? null);
        },
      });
      this.achievementService.refreshRewards();
    }
  }

  getRankLabel(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }

  getRankColors(rank: string) {
    return getRankColors(rank);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  getFrameClass(): string {
    return this.rewardVisuals.getFrameClass(this.equippedFrame());
  }

  getAuraClass(): string {
    return this.rewardVisuals.getAuraClass(this.equippedAura());
  }

  cancelDeletion(): void {
    if (this.cancelingDeletion()) return;
    this.cancelingDeletion.set(true);
    this.userService.cancelDeletion().subscribe({
      next: () => {
        this.cancelingDeletion.set(false);
        this.deletionScheduledAt.set(null);
        this.toastService.success('Eliminación cancelada');
      },
      error: (err) => {
        this.cancelingDeletion.set(false);
        this.toastService.error(err?.error?.message ?? 'Error al cancelar la eliminación');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}