import { Component, OnInit, signal, computed } from '@angular/core';
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

  unlocked = computed(() => this.achievements().filter(a => a.unlocked));
  locked = computed(() => this.achievements().filter(a => !a.unlocked));

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

  equip(rewardId: string): void {
    if (this.equipping()) return;
    this.equipping.set(rewardId);
    this.achievementService.equipReward(rewardId).subscribe({
      next: res => {
        const equipped = this.rewards().find(r => r.id === rewardId);
        this.rewards.update(list => list.map(r => ({
          ...r,
          isEquipped: r.id === res.rewardId
            ? true
            : r.type === equipped?.type
              ? false
              : r.isEquipped
        })));
        this.equipping.set(null);
      },
      error: () => this.equipping.set(null)
    });
  }

  getRewardTypeLabel(type: string): string {
    return ({
      AVATAR: 'Avatar',
      THEME: 'Tema',
      BADGE: 'Insignia',
      SIMULATOR_EVENT: 'Simulador',
      FRAME: 'Marco'
    } as any)[type] ?? type;
  }

  getRewardTypeColor(type: string): string {
    return ({
      AVATAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      THEME: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      BADGE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      SIMULATOR_EVENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      FRAME: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    } as any)[type] ?? 'bg-slate-500/20 text-slate-400 border-slate-600';
  }
}