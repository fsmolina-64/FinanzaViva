import { BoardCell, BackendPlayer } from '../../../core/models/simulator.model';

export function getTokenPos(p: BackendPlayer, animatingId: string | null, animatingPos: number): number {
  return p.id === animatingId ? animatingPos : p.position;
}

export function getPlayersOnCell(players: BackendPlayer[], pos: number, animatingId: string | null, animatingPos: number): BackendPlayer[] {
  return players.filter(p => getTokenPos(p, animatingId, animatingPos) === pos);
}

export function cellCol(pos: number): number {
  if (pos <= 10) return pos + 1;
  if (pos <= 19) return 11;
  if (pos <= 30) return 11 - (pos - 20);
  return 1;
}

export function cellRow(pos: number): number {
  if (pos <= 10) return 11;
  if (pos <= 19) return 11 - (pos - 10);
  if (pos <= 30) return 1;
  return pos - 29;
}

export function cellSection(pos: number): 'bottom' | 'right' | 'top' | 'left' | 'corner' {
  if ([0, 10, 20, 30].includes(pos)) return 'corner';
  if (pos < 10) return 'bottom';
  if (pos < 20) return 'right';
  if (pos < 30) return 'top';
  return 'left';
}

export function cellFlexClass(pos: number): string {
  return { bottom: 'flex-col', right: 'flex-row', top: 'flex-col-reverse', left: 'flex-row-reverse', corner: 'flex-col' }[cellSection(pos)];
}

export function bandIsHorizontal(pos: number): boolean {
  const s = cellSection(pos);
  return s === 'bottom' || s === 'top';
}

export function cellBg(cell: BoardCell): string {
  const g: Record<string, string> = { purple: '#2D1B69', blue: '#1a3360', pink: '#4A1030', orange: '#4A2010', red: '#4A0E0E', yellow: '#3A2C08', green: '#0E3A1A' };
  if (cell.group && g[cell.group]) return g[cell.group];
  const t: Record<string, string> = { TAX: '#3A0E0E', SCAM: '#3A0E0E', LOTTERY: '#332408', PENSION: '#0D2A3A', PENSION_ESPECIAL: '#0D2A3A', WILDCARD: '#221060', INICIO: '#0D3A1A', JAIL: '#111827', GO_TO_JAIL: '#2A1505', DECISION: '#041820', EDUCATIONAL: '#06083A' };
  return t[cell.type] ?? '#0E1827';
}

export function cellBandColor(cell: BoardCell): string {
  const g: Record<string, string> = { purple: '#7C3AED', blue: '#2563EB', pink: '#BE185D', orange: '#EA580C', red: '#DC2626', yellow: '#CA8A04', green: '#16A34A' };
  if (cell.group && g[cell.group]) return g[cell.group];
  const t: Record<string, string> = { TAX: '#991B1B', SCAM: '#991B1B', LOTTERY: '#B45309', PENSION: '#1D4ED8', PENSION_ESPECIAL: '#1D4ED8', WILDCARD: '#6D28D9', INICIO: '#15803D', JAIL: '#374151', GO_TO_JAIL: '#92400E', DECISION: '#06B6D4', EDUCATIONAL: '#6366F1' };
  return t[cell.type] ?? '#334155';
}

export function getOwner(players: BackendPlayer[], pos: number): BackendPlayer | null {
  return players.find(p => p.properties?.some(pr => pr.cellPosition === pos)) ?? null;
}

export function cellByPos(cells: BoardCell[], pos: number): BoardCell | undefined {
  return cells.find(c => c.position === pos);
}

export function getBandPositionClass(pos: number): string {
  switch (cellSection(pos)) {
    case 'bottom': return 'absolute top-0 left-0 right-0 h-[5px]';
    case 'right':  return 'absolute top-0 left-0 bottom-0 w-[5px]';
    case 'top':    return 'absolute bottom-0 left-0 right-0 h-[5px]';
    case 'left':   return 'absolute top-0 right-0 bottom-0 w-[5px]';
    default:       return 'hidden'; // corners
  }
}
