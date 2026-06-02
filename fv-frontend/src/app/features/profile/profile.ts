import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, UpdateProfileRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  user     = signal<UserProfile | null>(null);
  loading  = signal(true);
  saving   = signal(false);
  saved    = signal(false);
  editing  = signal(false);

  form: UpdateProfileRequest = { displayName: '', bio: '', avatarUrl: '' };

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: d => { this.user.set(d); this.loading.set(false); this.syncForm(d); },
      error: ()  => this.loading.set(false)
    });
  }

  private syncForm(u: UserProfile): void {
    this.form = {
      displayName: u.profile.displayName ?? '',
      bio:         u.profile.bio ?? '',
      avatarUrl:   u.profile.avatarUrl ?? ''
    };
  }

  saveProfile(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.userService.updateProfile(this.form).subscribe({
      next: d => {
        this.user.set(d);
        this.saving.set(false);
        this.saved.set(true);
        this.editing.set(false);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: () => this.saving.set(false)
    });
  }

  cancelEdit(): void {
    const u = this.user();
    if (u) this.syncForm(u);
    this.editing.set(false);
  }

  getXpProgress(): number {
    return (this.user()?.gameStats.xp ?? 0) % 100;
  }

  getRankLabel(rank: string): string {
    return ({
      ROOKIE: 'Novato', APPRENTICE: 'Aprendiz', INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado', EXPERT: 'Experto', MASTER: 'Master'
    } as any)[rank] ?? rank;
  }

  getRankColor(rank: string): string {
    return ({
      ROOKIE:       'bg-slate-500/20 text-slate-400 border-slate-500/30',
      APPRENTICE:   'bg-green-500/20 text-green-400 border-green-500/30',
      INTERMEDIATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ADVANCED:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
      EXPERT:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
      MASTER:       'bg-red-500/20 text-red-400 border-red-500/30'
    } as any)[rank] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPassRate(): number {
    const s = this.user()?.statistics;
    if (!s || !s.quizzesCompleted) return 0;
    return Math.round((s.quizzesPassed / s.quizzesCompleted) * 100);
  }

  getWinRate(): number {
    const s = this.user()?.statistics;
    if (!s || !s.gamesPlayed) return 0;
    return Math.round((s.gamesWon / s.gamesPlayed) * 100);
  }

  logout(): void {
    this.authService.logout();
  }
}