import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { forkJoin, of, Observable } from 'rxjs';
import { staggerCards } from '../../core/animations/animations';
import { AvatarIdentityService } from '../../core/services/avatar-identity.service';
import { RANK_LABEL_MAP } from '../../core/constants/rank-label.const';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { UserProfile, UpdateProfileRequest } from '../../core/models/user.model';
import { AchievementService } from '../../core/services/achievement.service';
import { Achievement, Reward } from '../../core/models/achievement.model';
import { ToastService } from '../../core/services/toast.service';
import { RewardVisualsService } from '../../core/services/reward-visuals.service';
import { getPasswordStrength, PasswordStrengthResult } from '../../core/utils/password-strength.util';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { RouterModule } from '@angular/router';

type Tab = 'perfil' | 'estadisticas' | 'cuenta' | 'actividad';

interface ActivityEvent {
  type: 'achievement' | 'password' | 'account';
  date: Date;
  title: string;
  description: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule, CountUpDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  animations: [
    staggerCards,
    trigger('tabTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class Profile implements OnInit {
  user = signal<UserProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  editing = signal(false);

  achievements = signal<Achievement[]>([]);
  equippedAvatar = computed(() => this.achievementService.rewards().find(r => r.type === 'AVATAR' && r.isEquipped) ?? null);
  equippedFrame = computed(() => this.achievementService.rewards().find(r => r.type === 'FRAME' && r.isEquipped) ?? null);
  equippedBadge = computed(() => this.achievementService.rewards().find(r => r.type === 'BADGE' && r.isEquipped) ?? null);
  equippedTitle = computed(() => this.achievementService.rewards().find(r => r.type === 'TITLE' && r.isEquipped) ?? null);
  equippedAura = computed(() => this.achievementService.rewards().find(r => r.type === 'AURA' && r.isEquipped) ?? null);

  rankingSummary = signal<{ position: number; total: number } | null>(null);

  activitySortOrder = signal<'desc' | 'asc'>('desc');

  form: UpdateProfileRequest = { displayName: '', bio: '', avatarUrl: '' };

  showPasswordSection = signal(false);
  changingPassword = signal(false);
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);
  passwordErrors = signal<{ current?: string; new?: string; confirm?: string }>({});
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  deleting = signal(false);
  showDeleteModal = signal(false);
  deleteConfirmText = signal('');
  deletePassword = signal('');
  showDeletePassword = signal(false);
  cancelingDeletion = signal(false);

  showCustomization = signal(false);
  customizing = signal(false);
  previewAvatar = signal<Reward | null>(null);
  previewFrame = signal<Reward | null>(null);
  previewBadge = signal<Reward | null>(null);
  previewTitle = signal<Reward | null>(null);
  previewAura = signal<Reward | null>(null);

  activeTab = signal<Tab>('perfil');

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'estadisticas', label: 'Estadísticas' },
    { key: 'cuenta', label: 'Cuenta' },
    { key: 'actividad', label: 'Actividad' },
  ];

  readonly strengthBars = [0, 1, 2, 3];

  readonly customizationSlots: { type: string; label: string }[] = [
    { type: 'AVATAR', label: 'Avatar' },
    { type: 'FRAME', label: 'Marco' },
    { type: 'BADGE', label: 'Insignia' },
    { type: 'TITLE', label: 'Título' },
    { type: 'AURA', label: 'Aura' },
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private achievementService: AchievementService,
    private toastService: ToastService,
    private rewardVisuals: RewardVisualsService,
    private api: ApiService,
    private avatarIdentity: AvatarIdentityService,
  ) { }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: d => { this.user.set(d); this.loading.set(false); this.syncForm(d); },
      error: () => { this.loading.set(false); this.toastService.error('Error al cargar el perfil'); }
    });
    this.achievementService.getRewards().subscribe({
      next: r => this.achievementService.rewards.set(r),
      error: () => this.toastService.error('Error al cargar recompensas')
    });
    this.achievementService.getAchievements().subscribe({
      next: d => this.achievements.set(d),
      error: () => this.toastService.error('Error al cargar logros')
    });
    this.loadRankingSummary();
  }


  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (this.editing()) this.cancelEdit();
  }


  startEdit(): void {
    if (this.editing()) { this.cancelEdit(); return; }
    this.activeTab.set('perfil');
    this.editing.set(true);
  }

  private syncForm(u: UserProfile): void {
    this.form = {
      displayName: u.profile.displayName ?? '',
      bio: u.profile.bio ?? '',
      avatarUrl: u.profile.avatarUrl ?? ''
    };
  }

  saveProfile(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const shouldUnequipAvatarReward = !!this.form.avatarUrl && !!this.equippedAvatar();
    const avatarRewardId = this.equippedAvatar()?.id;

    const calls: Observable<unknown>[] = [this.userService.updateProfile(this.form)];
    if (shouldUnequipAvatarReward && avatarRewardId) {
      calls.push(this.achievementService.equipReward(avatarRewardId));
    }

    forkJoin(calls).subscribe({
      next: () => {
        this.userService.getProfile().subscribe({
          next: fresh => {
            this.user.set(fresh);
            this.authService.refreshProfile(fresh.profile);
          }
        });
        if (shouldUnequipAvatarReward) {
          this.achievementService.refreshRewards();
        }
        this.saving.set(false);
        this.editing.set(false);
        this.toastService.success('Perfil actualizado correctamente');
      },
      error: () => {
        this.saving.set(false);
        this.toastService.error('Error al guardar los cambios');
      }
    });
  }

  cancelEdit(): void {
    const u = this.user();
    if (u) this.syncForm(u);
    this.editing.set(false);
  }


  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) {
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.passwordErrors.set({});
    }
  }

  changePassword(): void {
    const e: { current?: string; new?: string; confirm?: string } = {};
    if (!this.passwordForm.currentPassword) e.current = 'Contraseña actual requerida';

    if (this.passwordForm.newPassword.length < 8) {
      e.new = 'Mínimo 8 caracteres';
    } else if (getPasswordStrength(this.passwordForm.newPassword).score < 2) {
      e.new = 'Muy débil: combina mayúsculas, minúsculas, números y símbolos';
    } else if (this.passwordForm.newPassword === this.passwordForm.currentPassword) {
      e.new = 'Debe ser diferente a la contraseña actual';
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) e.confirm = 'Las contraseñas no coinciden';

    this.passwordErrors.set(e);
    if (Object.keys(e).length) return;

    this.changingPassword.set(true);
    this.userService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.showPasswordSection.set(false);
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.toastService.success('Contraseña actualizada correctamente');
      },
      error: (err) => {
        this.changingPassword.set(false);
        this.toastService.error(err?.error?.message ?? 'Error al cambiar la contraseña');
      }
    });
  }

  getNewPasswordStrength(): PasswordStrengthResult {
    return getPasswordStrength(this.passwordForm.newPassword);
  }

  strengthBarClass(score: number): string {
    if (score <= 1) return 'bg-danger';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  }

  strengthTextClass(score: number): string {
    if (score <= 1) return 'text-danger';
    if (score === 2) return 'text-amber-400';
    if (score === 3) return 'text-blue-400';
    return 'text-emerald-400';
  }

  openDeleteModal(): void {
    this.deleteConfirmText.set('');
    this.deletePassword.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmText.set('');
    this.deletePassword.set('');
  }

  confirmDelete(): void {
    if (this.deleteConfirmText() !== 'ELIMINAR' || !this.deletePassword() || this.deleting()) return;
    this.deleting.set(true);
    this.userService.deleteAccount(this.deletePassword()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteModal();
        this.userService.getProfile().subscribe({ next: fresh => this.user.set(fresh) });
        this.toastService.success('Cuenta programada para eliminación en 30 días. Puedes cancelarla cuando quieras.');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toastService.error(err?.error?.message ?? 'Error al eliminar la cuenta. Intenta de nuevo.');
      }
    });
  }

  cancelDeletion(): void {
    if (this.cancelingDeletion()) return;
    this.cancelingDeletion.set(true);
    this.userService.cancelDeletion().subscribe({
      next: () => {
        this.cancelingDeletion.set(false);
        this.userService.getProfile().subscribe({ next: fresh => this.user.set(fresh) });
        this.toastService.success('Eliminación cancelada');
      },
      error: (err) => {
        this.cancelingDeletion.set(false);
        this.toastService.error(err?.error?.message ?? 'Error al cancelar la eliminación');
      }
    });
  }

  getDaysUntilDeletion(): number {
    const scheduled = this.user()?.deletionScheduledAt;
    if (!scheduled) return 0;
    const diff = new Date(scheduled).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  unlockedByType(type: string): Reward[] {
    return this.achievementService.rewards().filter(r => r.type === type && r.unlocked);
  }

  toggleCustomization(): void {
    if (!this.showCustomization()) this.resetPreview();
    this.showCustomization.update(v => !v);
  }

  selectPreview(type: string, reward: Reward | null): void {
    const setters: Record<string, (r: Reward | null) => void> = {
      AVATAR: (r) => this.previewAvatar.set(r),
      FRAME: (r) => this.previewFrame.set(r),
      BADGE: (r) => this.previewBadge.set(r),
      TITLE: (r) => this.previewTitle.set(r),
      AURA: (r) => this.previewAura.set(r),
    };
    setters[type]?.(reward);
  }

  getPreviewValue(type: string): Reward | null {
    const map: Record<string, () => Reward | null> = {
      AVATAR: () => this.previewAvatar(),
      FRAME: () => this.previewFrame(),
      BADGE: () => this.previewBadge(),
      TITLE: () => this.previewTitle(),
      AURA: () => this.previewAura(),
    };
    return map[type]?.() ?? null;
  }

  getPreviewFrameClass(): string {
    return this.rewardVisuals.getFrameClass(this.previewFrame());
  }

  getPreviewAuraClass(): string {
    return this.rewardVisuals.getAuraClass(this.previewAura());
  }

  hasPreviewChanges(): boolean {
    return this.previewAvatar()?.id !== this.equippedAvatar()?.id
      || this.previewFrame()?.id !== this.equippedFrame()?.id
      || this.previewBadge()?.id !== this.equippedBadge()?.id
      || this.previewTitle()?.id !== this.equippedTitle()?.id
      || this.previewAura()?.id !== this.equippedAura()?.id;
  }

  resetPreview(): void {
    this.previewAvatar.set(this.equippedAvatar());
    this.previewFrame.set(this.equippedFrame());
    this.previewBadge.set(this.equippedBadge());
    this.previewTitle.set(this.equippedTitle());
    this.previewAura.set(this.equippedAura());
  }

  saveCustomization(): void {
    if (this.customizing() || !this.hasPreviewChanges()) return;
    this.customizing.set(true);

    const avatarChangedToReward = this.previewAvatar() !== null
      && this.previewAvatar()?.id !== this.equippedAvatar()?.id;

    const slots: Array<[Reward | null, Reward | null]> = [
      [this.equippedAvatar(), this.previewAvatar()],
      [this.equippedFrame(), this.previewFrame()],
      [this.equippedBadge(), this.previewBadge()],
      [this.equippedTitle(), this.previewTitle()],
      [this.equippedAura(), this.previewAura()],
    ];

    const calls = slots
      .filter(([current, next]) => current?.id !== next?.id)
      .flatMap(([current, next]) => {
        const ids: string[] = [];
        if (current) ids.push(current.id);
        if (next) ids.push(next.id);
        return ids;
      })
      .map(id => this.achievementService.equipReward(id));

    if (!calls.length) { this.customizing.set(false); return; }

    forkJoin(calls).subscribe({
      next: () => {
        const u = this.user();
        const needsUrlClear = avatarChangedToReward && !!u?.profile.avatarUrl;
        const cleanup: Observable<unknown> = needsUrlClear
          ? this.avatarIdentity.clearAvatarUrl({ displayName: u!.profile.displayName, bio: u!.profile.bio })
          : of(null);

        cleanup.subscribe({
          next: () => {
            this.achievementService.refreshRewards();
            this.userService.getProfile().subscribe({
              next: fresh => {
                this.user.set(fresh);
                this.authService.refreshProfile(fresh.profile);
              }
            });
            this.customizing.set(false);
            this.showCustomization.set(false);
            this.toastService.success('Apariencia actualizada');
          },
          error: () => {
            this.customizing.set(false);
            this.toastService.error('Recompensa equipada, pero no se pudo limpiar la URL de avatar anterior');
          }
        });
      },
      error: () => {
        this.customizing.set(false);
        this.toastService.error('Error al actualizar la apariencia');
      }
    });
  }


  private loadRankingSummary(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    forkJoin({
      position: this.api.get<{ position: number }>('/ranking/user/' + userId),
      list: this.api.get<{ meta: { total: number } }>('/ranking?page=1&limit=1'),
    }).subscribe({
      next: ({ position, list }) => {
        this.rankingSummary.set({ position: position.position, total: list.meta.total });
      },
      error: () => {
      }
    });
  }

  getTopPercent(): number {
    const s = this.rankingSummary();
    if (!s || !s.total) return 0;
    return Math.max(1, Math.round((s.position / s.total) * 100));
  }

  toggleActivitySort(): void {
    this.activitySortOrder.update(v => v === 'desc' ? 'asc' : 'desc');
  }

  getActivityTimeline(): ActivityEvent[] {
    const u = this.user();
    if (!u) return [];

    const events: ActivityEvent[] = [
      { type: 'account', date: new Date(u.createdAt), title: 'Cuenta creada', description: 'Te uniste a FinanzaViva' },
    ];

    if (u.passwordChangedAt) {
      events.push({
        type: 'password',
        date: new Date(u.passwordChangedAt),
        title: 'Contraseña actualizada',
        description: 'Cambiaste tu contraseña',
      });
    }

    for (const a of this.achievements()) {
      if (a.unlocked && a.unlockedAt) {
        events.push({
          type: 'achievement',
          date: new Date(a.unlockedAt),
          title: a.name,
          description: `Logro desbloqueado · +${a.xpReward} XP`,
        });
      }
    }

    const direction = this.activitySortOrder() === 'desc' ? -1 : 1;
    return events.sort((a, b) => (a.date.getTime() - b.date.getTime()) * direction);
  }


  getXpProgress(): number {
    return (this.user()?.gameStats.xp ?? 0) % 100;
  }

  getRankLabel(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }

  getRankColor(rank: string): string {
    return ({
      ROOKIE: 'bg-subtle/20 text-muted border-subtle/30',
      APPRENTICE: 'bg-success/20  text-success  border-success/30',
      INTERMEDIATE: 'bg-primary/20   text-primary   border-primary/30',
      ADVANCED: 'bg-primary-muted/20 text-primary-light border-primary-muted/30',
      EXPERT: 'bg-warning/20  text-warning  border-warning/30',
      MASTER: 'bg-danger/20    text-danger    border-danger/30'
    } as Record<string, string>)[rank] ?? 'bg-subtle/20 text-muted border-subtle/30';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPassRate(): number {
    const s = this.user()?.statistics;
    if (!s?.totalQuizzes) return 0;
    return Math.round((s.distinctPassedQuizzes ?? 0) / s.totalQuizzes * 100);
  }

  getWinRate(): number {
    const s = this.user()?.statistics;
    if (!s?.gamesPlayed) return 0;
    return Math.round((s.gamesWon / s.gamesPlayed) * 100);
  }

  getFrameClass(): string {
    return this.rewardVisuals.getFrameClass(this.equippedFrame());
  }

  getAuraClass(): string {
    return this.rewardVisuals.getAuraClass(this.equippedAura());
  }

  logout(): void {
    this.authService.logout();
  }
}
