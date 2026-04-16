import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService, RankingPlayer } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-ranking',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css',
})
export class Ranking {
  game = inject(GameService);

  activeFilter = signal<'monedas' | 'nivel' | 'xp'>('monedas');

  readonly allPlayers = computed(() => {
    const base = this.game.rankingPlayers();
    const me: RankingPlayer = {
      rank: 0,
      name: this.game.playerName() + ' (Tú)',
      avatar: this.game.playerAvatar(),
      coins: this.game.coins(),
      level: this.game.level(),
      xp: this.game.xp(),
      profile: this.game.financialProfile() ?? 'equilibrado',
    };
    const all = [...base, me].sort((a, b) => b.coins - a.coins).map((p, i) => ({ ...p, rank: i + 1 }));
    return all;
  });

  sortedPlayers = computed(() => {
    const players = this.allPlayers();
    const f = this.activeFilter();
    return [...players].sort((a, b) => {
      if (f === 'nivel') return b.level - a.level;
      if (f === 'xp') return b.xp - a.xp;
      return b.coins - a.coins;
    }).map((p, i) => ({ ...p, rank: i + 1 }));
  });

  myRank = computed(() => {
    const players = this.sortedPlayers();
    return players.find(p => p.name.includes('(Tú)'))?.rank ?? '-';
  });

  isMe(player: RankingPlayer): boolean {
    return player.name.includes('(Tú)');
  }

  getMedalEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  getBarWidth(player: RankingPlayer): number {
    const max = this.sortedPlayers()[0];
    if (!max) return 0;
    const f = this.activeFilter();
    if (f === 'nivel') return (player.level / max.level) * 100;
    if (f === 'xp') return (player.xp / max.xp) * 100;
    return (player.coins / max.coins) * 100;
  }

  getFilterValue(player: RankingPlayer): string | number {
    const f = this.activeFilter();
    if (f === 'nivel') return `Nv. ${player.level}`;
    if (f === 'xp') return `${player.xp} XP`;
    return `$${player.coins.toLocaleString()}`;
  }

  profileLabel(profile: string): string {
    const labels: Record<string, string> = {
      ahorrista: '🐷 Ahorrador', inversor: '📈 Inversor',
      gastador: '🛍️ Vividor', equilibrado: '⚖️ Equilibrado',
    };
    return labels[profile] ?? profile;
  }
}
