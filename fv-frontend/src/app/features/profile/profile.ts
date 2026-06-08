import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  // ─── Tabs ───────────────────────────────────────────────────────────────────

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (this.editing()) this.cancelEdit();
  }

  startEdit(): void {
    this.activeTab.set('perfil');
    this.editing.set(true);
  }

  // ─── Perfil ─────────────────────────────────────────────────────────────────

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

  // ─── Danger Zone ────────────────────────────────────────────────────────────

  openDeleteModal(): void {
    this.deleteConfirmText.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmText.set('');
  }

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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getXpProgress(): number {
    return (this.user()?.gameStats.xp ?? 0) % 100;
  }

  getRankLabel(rank: string): string {
    return ({
      ROOKIE: 'Novato',
      APPRENTICE: 'Aprendiz',
      INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado',
      EXPERT: 'Experto',
      MASTER: 'Master'
    } as Record<string, string>)[rank] ?? rank;
  }

  getRankColor(rank: string): string {
    return ({
      ROOKIE: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      APPRENTICE: 'bg-green-500/20  text-green-400  border-green-500/30',
      INTERMEDIATE: 'bg-blue-500/20   text-blue-400   border-blue-500/30',
      ADVANCED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      EXPERT: 'bg-amber-500/20  text-amber-400  border-amber-500/30',
      MASTER: 'bg-red-500/20    text-red-400    border-red-500/30'
    } as Record<string, string>)[rank] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPassRate(): number {
    const s = this.user()?.statistics;
    if (!s?.quizzesCompleted) return 0;
    return Math.round((s.quizzesPassed / s.quizzesCompleted) * 100);
  }

  getWinRate(): number {
    const s = this.user()?.statistics;
    if (!s?.gamesPlayed) return 0;
    return Math.round((s.gamesWon / s.gamesPlayed) * 100);
  }

  getFrameClass(): string {
    const f = this.equippedFrame();
    if (!f) return 'border-slate-600';
    return f.icon === '🥇'
      ? 'border-yellow-400 shadow-yellow-400/30 shadow-md'
      : 'border-slate-400 shadow-slate-400/30 shadow-md';
  }

  logout(): void {
    this.authService.logout();
  }
}