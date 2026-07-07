import { Injectable } from '@angular/core';
import { AcademyService } from './academy.service';

@Injectable({ providedIn: 'root' })
export class ReadingProgressService {
  constructor(private academyService: AcademyService) { }

  refreshProgress(moduleId: string, callback: (value: number) => void): void {
    this.academyService.getReadingProgress(moduleId).subscribe({
      next: res => callback(res.readingProgress),
      error: () => {},
    });
  }
}
