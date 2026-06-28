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

type Tab = 'perfil' | 'estadisticas' | 'cuenta';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user = signal<UserProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  editing = signal(false);
  deleting = signal(false);

  rewards = signal<Reward[]>([]);
  equippedAvatar = computed(() => this.rewards().find(r => r.type === 'AVATAR' && r.isEquipped) ?? null);
  equippedFrame = computed(() => this.rewards().find(r => r.type === 'FRAME' && r.isEquipped) ?? null);
  equippedBadge = computed(() => this.rewards().find(r => r.type === 'BADGE' && r.isEquipped) ?? null);
  equippedTitle = computed(() => this.rewards().find(r => r.type === 'TITLE' && r.isEquipped) ?? null);
  equippedAura = computed(() => this.rewards().find(r => r.type === 'AURA' && r.isEquipped) ?? null);

  activeTab = signal<Tab>('perfil');
  showDeleteModal = signal(false);
  deleteConfirmText = signal('');

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
    private toastService: ToastService
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
            this.authService.currentUser.update(prev => prev ? ({
              ...prev,
              displayName: fresh.profile?.displayName ?? prev.displayName,
              avatarUrl: fresh.profile?.avatarUrl ?? prev.avatarUrl,
            }) : prev);
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
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmText.set('');
  }
  showPasswordSection = signal(false);
  changingPassword = signal(false);
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);
  passwordErrors = signal<{ current?: string; new?: string; confirm?: string }>({});
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  confirmDelete(): void {
    if (this.deleteConfirmText() !== 'ELIMINAR' || this.deleting()) return;
    this.deleting.set(true);
    this.userService.deleteAccount().subscribe({
      next: () => {
        this.toastService.success('Cuenta eliminada');
        this.authService.logout();
      },
      error: () => {
        this.deleting.set(false);
        this.toastService.error('Error al eliminar la cuenta. Intenta de nuevo.');
      }
    });
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
    if (this.passwordForm.newPassword.length < 8) e.new = 'Mínimo 8 caracteres';
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
}