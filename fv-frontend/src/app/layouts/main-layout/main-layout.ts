import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { GamificationService } from '../../core/services/gamification.service';
import { AchievementService } from '../../core/services/achievement.service';
import { Reward } from '../../core/models/achievement.model';
import { RANK_LABEL_MAP } from '../../shared/pipes/rank-label.pipe';
import { ToastComponent } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule, CommonModule, ToastComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  sidebarOpen = signal(true);

  rewards = signal<Reward[]>([]);

  equippedAvatar = computed(() => this.rewards().find(r => r.type === 'AVATAR' && r.isEquipped) ?? null);
  equippedFrame = computed(() => this.rewards().find(r => r.type === 'FRAME' && r.isEquipped) ?? null);
  equippedBadge = computed(() => this.rewards().find(r => r.type === 'BADGE' && r.isEquipped) ?? null);
  equippedAura = computed(() => this.rewards().find(r => r.type === 'AURA' && r.isEquipped) ?? null);

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
  ) { }

  ngOnInit(): void {
    if (this.authService.currentUser()) {
      this.gamificationService.loadStats().subscribe();
      this.gamificationService.registerStreak().subscribe();
      this.userService.getProfile().subscribe({
        next: p => this.authService.refreshProfile(p.profile),
      });
      this.achievementService.getRewards().subscribe({
        next: r => this.rewards.set(r),
      });
    }
  }

  getRankLabel(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  getFrameClass(): string {
    const f = this.equippedFrame();
    if (!f) return 'border-strong';
    const map: Record<string, string> = {
      '🥉': 'border-amber-700 shadow-amber-700/40 shadow-md',
      '🥈': 'border-muted shadow-muted/40 shadow-md',
      '🥇': 'border-warning shadow-warning/50 shadow-lg',
      '💠': 'border-primary shadow-primary/50 shadow-lg',
    };
    return map[f.icon] ?? 'border-strong';
  }

  getAuraClass(): string {
    const a = this.equippedAura();
    if (!a) return '';
    if (a.icon === '💙') return 'aura-blue';
    if (a.icon === '✨') return 'aura-gold';
    if (a.icon === '🔮') return 'aura-legendary';
    return '';
  }

  logout(): void {
    this.authService.logout();
  }
}