import { Injectable } from '@angular/core';
import { AcademyService } from './academy.service';

@Injectable({ providedIn: 'root' })
export class ReadingProgressService {
  constructor(private academyService: AcademyService) { }

  getProgress(moduleId: string): number {
    return 0;
  }

  refreshProgress(moduleId: string, callback: (value: number) => void): void {
    this.academyService.getReadingProgress(moduleId).subscribe({
      next: res => callback(res.readingProgress),
    });
  }

  recordScroll(_lessonId: string, _moduleId: string): number {
    return 0;
  }

  recordHint(_lessonId: string, _moduleId: string): number {
    return 0;
  }

  recordComplete(_lessonId: string, _moduleId: string): number {
    return 0;
  }
}
