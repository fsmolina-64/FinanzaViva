import { Pipe, PipeTransform } from '@angular/core';
import { RANK_LABEL_MAP } from '../../core/constants/rank-label.const';

@Pipe({
  name: 'rankLabel',
  standalone: true,
})
export class RankLabelPipe implements PipeTransform {
  transform(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }
}
