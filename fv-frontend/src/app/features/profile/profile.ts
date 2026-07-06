import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RANK_LABEL_MAP } from '../../shared/pipes/rank-label.pipe';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, UpdateProfileRequest } from '../../core/models/user.model';
import { AchievementService } from '../../core/services/achievement.service';
import { Reward } from '../../core/models/achievement.model';
import { ToastService } from '../../core/services/toast.service';
import { RewardVisualsService } from '../../core/services/reward-visuals.service';
import { getPasswordStrength, PasswordStrengthResult } from '../../core/utils/password-strength.util';
import { RouterModule } from '@angular/router';

type Tab = 'perfil' | 'estadisticas' | 'cuenta';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user = signal<UserProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  editing = signal(false);
  deleting = signal(false);
  cancelingDeletion = signal(false);

  rewards = signal<Reward[]>([]);
  equippedAvatar = computed(() => this.rewards().find(r => r.type === 'AVATAR' && r.isEquipped) ?? null);
  equippedFrame = computed(() => this.rewards().find(r => r.type === 'FRAME' && r.isEquipped) ?? null);
  equippedBadge = computed(() => this.rewards().find(r => r.type === 'BADGE' && r.isEquipped) ?? null);
  equippedTitle = computed(() => this.rewards().find(r => r.type === 'TITLE' && r.isEquipped) ?? null);
  equippedAura = computed(() => this.rewards().find(r => r.type === 'AURA' && r.isEquipped) ?? null);

  activeTab = signal<Tab>('perfil');
  showDeleteModal = signal(false);
  deleteConfirmText = signal('');
  deletePassword = signal('');
  showDeletePassword = signal(false);

  readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'perfil', label: 'Perfil', icon: '👤' },
    { key: 'estadisticas', label: 'Estadísticas', icon: '📊' },
    { key: 'cuenta', label: 'Cuenta', icon: '⚙️' },
  ];

  form: UpdateProfileRequest = { displayName: '', bio: '', avatarUrl: '' };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private achievementService: AchievementService,
    private toastService: ToastService,
    private rewardVisuals: RewardVisualsService
  ) { }

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: d => { this.user.set(d); this.loading.set(false); this.syncForm(d); },
      error: () => { this.loading.set(false); this.toastService.error('Error al cargar el perfil'); }
    });
    this.achievementService.getRewards().subscribe({
      next: d => this.rewards.set(d)
    });
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
    this.userService.updateProfile(this.form).subscribe({
      next: _ => {
        this.userService.getProfile().subscribe({
          next: fresh => {
            this.user.set(fresh);
            this.authService.refreshProfile(fresh.profile);
          }
        });
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
  showPasswordSection = signal(false);
  changingPassword = signal(false);
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);
  passwordErrors = signal<{ current?: string; new?: string; confirm?: string }>({});
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
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
    if (!s?.quizzesCompleted) return 0;
    return Math.round((s.distinctPassedQuizzes ?? 0) / s.quizzesCompleted * 100);
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
  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) {
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.passwordErrors.set({});
    }
  }

  readonly strengthBars = [0, 1, 2, 3];

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
}