import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AcademyService } from '../../../core/services/academy.service';
import { Lesson, LessonCompleteResponse } from '../../../core/models/academy.model';

@Component({
  selector: 'app-lesson',
  imports: [CommonModule, RouterModule],
  templateUrl: './lesson.html'
})
export class LessonComponent implements OnInit {
  lesson = signal<Lesson | null>(null);
  loading = signal(true);
  completing = signal(false);
  result = signal<LessonCompleteResponse | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academyService: AcademyService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('lessonId')!;
    this.academyService.getLesson(id).subscribe({
      next: d => { this.lesson.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  complete(): void {
    if (this.completing()) return;
    this.completing.set(true);
    this.academyService.completeLesson(this.lesson()!.id).subscribe({
      next: res => {
        this.result.set(res);
        this.completing.set(false);
      },
      error: () => this.completing.set(false)
    });
  }

  goNext(): void {
    const next = this.result()?.nextLesson;
    if (next) {
      this.router.navigate(['/academy/lesson', next.id]);
      this.result.set(null);
      this.lesson.set(next);
    } else {
      this.router.navigate(['/academy']);
    }
  }
}