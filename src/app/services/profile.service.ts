import { Injectable, signal, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface UserProfile {
  name: string;
  email: string;
  dob: string;
  bio: string;
  interests: string[];
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  quizzesCompleted: number;
  achievementsUnlocked: string[];
  joinedAt: string;
}

const AVATARS = ['🦊', '🐯', '🦁', '🐻', '🦋', '🐺', '🦅', '🦉', '🐸', '🐙', '🦜', '🐳'];
const INTEREST_OPTIONS = ['Inversiones', 'Ahorro', 'Negocios', 'Criptomonedas', 'Bienes Raíces', 'Presupuesto', 'Deudas', 'Jubilación', 'Trading', 'Freelance'];

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private auth = inject(AuthService);
  private readonly PREFIX = 'fv_profile_';
  private readonly AVATARS = AVATARS;

  readonly avatarOptions = AVATARS;
  readonly interestOptions = INTEREST_OPTIONS;

  profile = signal<UserProfile | null>(null);

  loadForCurrentUser() {
    const sess = this.auth.session();
    if (!sess) { this.profile.set(null); return; }
    const key = this.PREFIX + sess.email;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        this.profile.set(JSON.parse(raw));
      } else {
        const def: UserProfile = {
          name: sess.name, email: sess.email,
          dob: '', bio: '', interests: [],
          avatar: '🦊', coins: 500, xp: 0, level: 1,
          quizzesCompleted: 0, achievementsUnlocked: [],
          joinedAt: new Date().toISOString(),
        };
        this.save(def);
      }
    } catch { }
  }

  save(profile: UserProfile) {
    const sess = this.auth.session();
    if (!sess) return;
    const key = this.PREFIX + sess.email;
    localStorage.setItem(key, JSON.stringify(profile));
    this.profile.set(profile);
  }

  update(partial: Partial<UserProfile>) {
    const current = this.profile();
    if (!current) return;
    this.save({ ...current, ...partial });
  }

  addCoins(amount: number) {
    const p = this.profile();
    if (!p) return;
    this.update({ coins: p.coins + amount });
    this.checkLevel();
  }

  removeCoins(amount: number): boolean {
    const p = this.profile();
    if (!p || p.coins < amount) return false;
    this.update({ coins: p.coins - amount });
    return true;
  }

  addXP(amount: number) {
    const p = this.profile();
    if (!p) return;
    const newXP = p.xp + amount;
    const newLevel = Math.floor(newXP / 300) + 1;
    this.update({ xp: newXP, level: newLevel });
  }

  completeQuiz(coinsReward: number, xpReward: number) {
    const p = this.profile();
    if (!p) return;
    this.update({
      coins: p.coins + coinsReward,
      xp: p.xp + xpReward,
      level: Math.floor((p.xp + xpReward) / 300) + 1,
      quizzesCompleted: p.quizzesCompleted + 1,
    });
  }

  unlockAchievement(id: string) {
    const p = this.profile();
    if (!p || p.achievementsUnlocked.includes(id)) return;
    this.update({ achievementsUnlocked: [...p.achievementsUnlocked, id] });
  }

  private checkLevel() {
    const p = this.profile();
    if (!p) return;
    const newLevel = Math.floor(p.xp / 300) + 1;
    if (newLevel > p.level) this.update({ level: newLevel });
  }

  get xpProgress(): number {
    const p = this.profile();
    if (!p) return 0;
    const xpInLevel = p.xp % 300;
    return Math.min(100, (xpInLevel / 300) * 100);
  }
}
