import { BackendPlayer, BoardCell, GamePhase } from '../../../core/models/simulator.model';

export function playerHex(idx: number): string {
  return ['#3B82F6', '#EF4444', '#10B981', '#EAB308', '#A855F7', '#EC4899', '#06B6D4', '#F97316'][idx % 8];
}

export function playerBg(idx: number): string {
  return ['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'][idx % 8];
}

export function playerText(idx: number): string {
  return ['text-blue-400', 'text-red-400', 'text-emerald-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400', 'text-orange-400'][idx % 8];
}

export function playerToken(p: BackendPlayer): string {
  return p.tokenSymbol ?? '★';
}

export function abbr(name: string, max = 10): string {
  return name.length <= max ? name : name.slice(0, max - 1) + '.';
}

export function cellTypeIcon(cell: BoardCell): string {
  if (cell.type === 'TAX' || cell.type === 'SCAM') return '-$';
  if (cell.type === 'LOTTERY') return '+$';
  if (cell.type === 'PENSION' || cell.type === 'PENSION_ESPECIAL') return '$';
  if (cell.type === 'WILDCARD') return '?';
  if (cell.type === 'GO_TO_JAIL') return '!';
  return '';
}

export function phaseLabel(ph?: GamePhase): string {
  const m: Record<string, string> = {
    ROLLING: 'Lanzar dados', MOVING: 'Moviendo', ACTION: 'Accion',
    BUYING: 'Comprar', WILDCARD_REVEAL: 'Carta', DECISION_PENDING: 'Decision', BETWEEN_TURNS: 'Terminar turno',
    FINISHED: 'Finalizada', ABANDONED: 'Abandonada', WAITING: 'Esperando',
  };
  return m[ph ?? ''] ?? '';
}

export function modeLabel(m?: string): string {
  return { SOLO: 'Solo', MULTIPLAYER: 'Multijugador', MIXED: 'Mixto', SIMULATION: 'Observar' }[m ?? ''] ?? '';
}

export function fmt(v: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);
}

export function calcXP(maxRounds: number, rankedPlayers: BackendPlayer[]): number {
  const hIdx = rankedPlayers.findIndex(p => !p.isBot);
  const base = [50, 80, 120, 175][maxRounds <= 3 ? 0 : maxRounds <= 5 ? 1 : maxRounds <= 7 ? 2 : 3];
  const mult = [2.0, 1.5, 1.2, 1.0][Math.max(0, hIdx)] ?? 1.0;
  const props = (rankedPlayers[hIdx]?.properties?.length ?? 0) * 3;
  return Math.max(10, Math.round(base * mult + props));
}

export const TOKEN_TO_FICHA: Record<string, string> = {
  '★': '/ficha1.png',
  '♦': '/ficha2.png',
  '♣': '/ficha3.png',
  '♥': '/ficha4.png',
  '■': '/ficha5.png',
  '▲': '/ficha6.png',
  '●': '/ficha7.png',
  '◆': '/ficha8.png',
};

export function fichaImg(p: BackendPlayer): string {
  return TOKEN_TO_FICHA[p.tokenSymbol ?? '★'] ?? '/ficha1.png';
}

export function playerRgba(idx: number, alpha: number): string {
  const hex = playerHex(idx);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function healthPercent(money: number, initialMoney: number): number {
  return Math.max(0, Math.min(100, (money / initialMoney) * 100));
}

export function healthColor(pct: number): string {
  if (pct >= 75) return '#10B981';
  if (pct >= 40) return '#F59E0B';
  if (pct >= 10) return '#F97316';
  return '#EF4444';
}

export function diceDots(face: number): Array<{ t: string; l: string }> {
  const P: Record<number, Array<{ t: string; l: string }>> = {
    1: [{ t: '50%', l: '50%' }],
    2: [{ t: '28%', l: '72%' }, { t: '72%', l: '28%' }],
    3: [{ t: '25%', l: '75%' }, { t: '50%', l: '50%' }, { t: '75%', l: '25%' }],
    4: [{ t: '28%', l: '28%' }, { t: '28%', l: '72%' }, { t: '72%', l: '28%' }, { t: '72%', l: '72%' }],
    5: [{ t: '28%', l: '28%' }, { t: '28%', l: '72%' }, { t: '50%', l: '50%' }, { t: '72%', l: '28%' }, { t: '72%', l: '72%' }],
    6: [{ t: '22%', l: '28%' }, { t: '22%', l: '72%' }, { t: '50%', l: '28%' }, { t: '50%', l: '72%' }, { t: '78%', l: '28%' }, { t: '78%', l: '72%' }],
  };
  return P[face] ?? [];
}
