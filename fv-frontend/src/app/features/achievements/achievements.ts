import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../core/services/achievement.service';
import { Achievement, Reward } from '../../core/models/achievement.model';

type Tab = 'logros' | 'recompensas';

@Component({
  selector: 'app-achievements',
  imports: [CommonModule],
  templateUrl: './achievements.html'
})
export class Achievements implements OnInit {
  activeTab = signal<Tab>('logros');
  achievements = signal<Achievement[]>([]);
  rewards = signal<Reward[]>([]);
  loading = signal(true);
  equipping = signal<string | null>(null);

  tabs: { key: Tab; label: string }[] = [
    { key: 'logros', label: 'Logros' },
    { key: 'recompensas', label: 'Recompensas' }
  ];

  constructor(private achievementService: AchievementService) { }

  ngOnInit(): void {
    let done = 0;
    const check = () => { if (++done >= 2) this.loading.set(false); };
    this.achievementService.getAchievements().subscribe({
      next: d => { this.achievements.set(d); check(); },
      error: check
    });
    this.achievementService.getRewards().subscribe({
      next: d => { this.rewards.set(d); check(); },
      error: check
    });
  }

  equip(id: string): void {
    if (this.equipping()) return;
    this.equipping.set(id);
    this.achievementService.equipReward(id).subscribe({
      next: res => {
        this.rewards.update(list => list.map(r => ({
          ...r,
          equipped: r.id === res.reward.id
        })));
        this.equipping.set(null);
      },
      error: () => this.equipping.set(null)
    });
  }

  unlocked(): Achievement[] {
    return this.achievements().filter(a => a.status === 'UNLOCKED');
  }
  locked(): Achievement[] {
    return this.achievements().filter(a => a.status === 'LOCKED');
  }

  getRewardTypeLabel(type: string): string {
    return ({ AVATAR: 'Avatar', BORDER: 'Borde', BADGE: 'Insignia', TITLE: 'Titulo' } as any)[type] ?? type;
  }

  getRewardTypeColor(type: string): string {
    return ({
      AVATAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      BORDER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      BADGE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      TITLE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    } as any)[type] ?? 'bg-slate-500/20 text-slate-400 border-slate-600';
  }
}