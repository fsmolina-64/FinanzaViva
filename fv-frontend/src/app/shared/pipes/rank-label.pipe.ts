import { Pipe, PipeTransform } from '@angular/core';

export const RANK_LABEL_MAP: Record<string, string> = {
  ROOKIE: 'Novato',
  APPRENTICE: 'Aprendiz',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  EXPERT: 'Experto',
  MASTER: 'Maestro',
};

@Pipe({
  name: 'rankLabel',
  standalone: true,
})
export class RankLabelPipe implements PipeTransform {
  transform(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }
}
