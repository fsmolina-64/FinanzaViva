import { Component, OnInit, signal, computed } from '@angular/core';
import { staggerCards } from '../../core/animations/animations';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AchievementService } from '../../core/services/achievement.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AvatarIdentityService } from '../../core/services/avatar-identity.service';
import { Achievement, Reward } from '../../core/models/achievement.model';
import { UserProfile } from '../../core/models/user.model';

type Tab = 'logros' | 'recompensas';

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  LEARNING: { label: 'Academia', icon: '📖' },
  FINANCES: { label: 'Finanzas', icon: '💰' },
  SIMULATOR: { label: 'Simulador', icon: '🎮' },
  STREAK: { label: 'Racha', icon: '🔥' },
  GENERAL: { label: 'General', icon: '⭐' },
};

const METRIC_MAP: Record<string, (u: UserProfile) => number> = {
  lessons_completed: u => u.statistics.lessonsCompleted,
  modules_completed: u => u.statistics.modulesCompleted,
  quizzes_passed: u => u.statistics.quizzesPassed,
  total_transactions: u => u.statistics.totalTransactions,
  games_played: u => u.statistics.gamesPlayed,
  games_won: u => u.statistics.gamesWon,
  current_streak: u => u.gameStats.currentStreak,
  longest_streak: u => u.gameStats.longestStreak,
  total_xp: u => u.statistics.totalXpEarned,
  level: u => u.gameStats.level,
};

@Component({
  selector: 'app-achievements',
  imports: [CommonModule],
  templateUrl: './achievements.html',
  animations: [staggerCards]
})
export class Achievements implements OnInit {
  activeTab = signal<Tab>('logros');
  achievements = signal<Achievement[]>([]);
  userProfile = signal<UserProfile | null>(null);
  loading = signal(true);
  equipping = signal<string | null>(null);
  unequippingAll = signal(false);

  unlocked = computed(() => this.achievements().filter(a => a.unlocked));
  locked = computed(() => this.achievements().filter(a => !a.unlocked));

  groupedUnlocked = computed(() => this.groupByCategory(this.unlocked()));
  groupedLocked = computed(() => this.groupByCategory(this.locked()));
  categories = computed(() => Object.keys(CATEGORY_META));

  equippedCount = computed(() => this.achievementService.rewards().filter(r => r.isEquipped).length);

  tabs: { key: Tab; label: string }[] = [
    { key: 'logros', label: 'Logros' },
    { key: 'recompensas', label: 'Recompensas' },
  ];

  constructor(
    public achievementService: AchievementService,
    private api: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private avatarIdentity: AvatarIdentityService,
  ) { }

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParams['tab'] as Tab;
    if (tab === 'recompensas') this.activeTab.set('recompensas');

    let done = 0;
    const check = () => { if (++done >= 3) this.loading.set(false); };

    this.achievementService.getAchievements().subscribe({
      next: d => { this.achievements.set(d); check(); },
      error: () => { check(); this.toast.error('Error al cargar logros'); }
    });
    this.achievementService.getRewards().subscribe({
      next: d => { this.achievementService.rewards.set(d); check(); },
      error: () => { check(); this.toast.error('Error al cargar recompensas'); }
    });
    this.api.get<UserProfile>('/users/me').subscribe({
      next: d => { this.userProfile.set(d); check(); },
      error: () => { check(); this.toast.error('Error al cargar perfil'); }
    });
  }

  private groupByCategory(list: Achievement[]): Record<string, Achievement[]> {
    return list.reduce((acc, a) => {
      (acc[a.category] ??= []).push(a);
      return acc;
    }, {} as Record<string, Achievement[]>);
  }

  getCategoryLabel(cat: string): string { return CATEGORY_META[cat]?.label ?? cat; }
  getCategoryIcon(cat: string): string { return CATEGORY_META[cat]?.icon ?? '🏅'; }

  getProgress(a: Achievement): number {
    const user = this.userProfile();
    if (!user) return 0;
    const fn = METRIC_MAP[a.condition.metric];
    return fn ? Math.min(fn(user), a.condition.threshold) : 0;
  }

  getProgressPct(a: Achievement): number {
    return a.condition.threshold ? (this.getProgress(a) / a.condition.threshold) * 100 : 0;
  }

  toggleEquip(rewardId: string): void {
    if (this.equipping()) return;
    this.equipping.set(rewardId);

    const target = this.achievementService.rewards().find(r => r.id === rewardId);

    this.achievementService.equipReward(rewardId).subscribe({
      next: res => {
        this.achievementService.rewards.update(list => list.map(r => {
          if (r.id === rewardId) return { ...r, isEquipped: res.isEquipped };
          if (res.isEquipped && r.type === target?.type) return { ...r, isEquipped: false };
          return r;
        }));

        if (target?.type === 'AVATAR' && res.isEquipped) {
          this.clearAvatarUrlAfterEquip();
        } else {
          this.equipping.set(null);
          this.toast.success(res.isEquipped ? 'Recompensa equipada' : 'Recompensa desequipada');
        }
      },
      error: () => {
        this.equipping.set(null);
        this.toast.error('Error al actualizar la recompensa');
      }
    });
  }

  // Equipar un avatar de recompensa borra avatarUrl del perfil, para que no
  // quede una URL huérfana que reaparezca si luego se desequipa el avatar.
  private clearAvatarUrlAfterEquip(): void {
    const u = this.userProfile();
    if (!u?.profile.avatarUrl) {
      this.equipping.set(null);
      this.toast.success('Recompensa equipada');
      return;
    }

    this.avatarIdentity.clearAvatarUrl({ displayName: u.profile.displayName, bio: u.profile.bio }).subscribe({
      next: () => {
        this.userProfile.update(user => user ? { ...user, profile: { ...user.profile, avatarUrl: '' } } : user);
        this.authService.refreshProfile({ displayName: u.profile.displayName, avatarUrl: '' });
        this.equipping.set(null);
        this.toast.success('Recompensa equipada');
      },
      error: () => {
        // El equip sí funcionó (ya está reflejado arriba); solo falló limpiar
        // la URL vieja. No se revierte el equip por esto.
        this.equipping.set(null);
        this.toast.success('Recompensa equipada');
      }
    });
  }

  unequipAll(): void {
    if (this.unequippingAll()) return;
    const equipped = this.achievementService.rewards().filter(r => r.isEquipped);
    if (!equipped.length) return;

    this.unequippingAll.set(true);
    forkJoin(equipped.map(r => this.achievementService.equipReward(r.id))).subscribe({
      next: () => {
        this.achievementService.rewards.update(list => list.map(r => ({ ...r, isEquipped: false })));
        this.unequippingAll.set(false);
        this.toast.success('Todas las recompensas desequipadas');
      },
      error: () => {
        this.achievementService.refreshRewards();
        this.unequippingAll.set(false);
        this.toast.error('Error al desequipar algunas recompensas');
      }
    });
  }

  getRewardTypeLabel(type: string): string {
    return ({
      AVATAR: 'Avatar',
      TITLE: 'Título',
      AURA: 'Aura',
      BADGE: 'Insignia',
      SIMULATOR_EVENT: 'Simulador',
      FRAME: 'Marco'
    } as any)[type] ?? type;
  }

  getRewardTypeColor(type: string): string {
    return ({
      AVATAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      TITLE: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      AURA: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      BADGE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      SIMULATOR_EVENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      FRAME: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    } as any)[type] ?? 'bg-muted/20 text-muted border-strong';
  }

  groupLen(group: Record<string, Achievement[]>, cat: string): number {
    return group[cat]?.length ?? 0;
  }
}