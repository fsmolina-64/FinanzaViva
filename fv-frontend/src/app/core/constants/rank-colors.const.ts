export interface RankColorSet {
  badge: string;
  barFrom: string;
  barTo: string;
  dot: string;
}

export const RANK_COLORS: Record<string, RankColorSet> = {
  ROOKIE:       { badge: 'bg-subtle/20 text-muted border-subtle/30',           barFrom: 'from-gray-500',    barTo: 'to-gray-400',    dot: 'bg-gray-400' },
  APPRENTICE:   { badge: 'bg-success/20 text-success border-success/30',       barFrom: 'from-emerald-600', barTo: 'to-emerald-400', dot: 'bg-success' },
  INTERMEDIATE: { badge: 'bg-primary/20 text-primary border-primary/30',       barFrom: 'from-blue-600',    barTo: 'to-blue-400',    dot: 'bg-blue-400' },
  ADVANCED:     { badge: 'bg-primary-muted/20 text-primary-light border-primary-muted/30', barFrom: 'from-slate-400', barTo: 'to-slate-300', dot: 'bg-slate-300' },
  EXPERT:       { badge: 'bg-warning/20 text-warning border-warning/30',       barFrom: 'from-amber-500',   barTo: 'to-amber-300',   dot: 'bg-warning' },
  MASTER:       { badge: 'bg-danger/20 text-danger border-danger/30',          barFrom: 'from-red-500',     barTo: 'to-red-400',     dot: 'bg-danger' },
};

export function getRankColors(rank: string): RankColorSet {
  return RANK_COLORS[rank] ?? RANK_COLORS['ROOKIE'];
}
