import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AcademyService } from '../../../core/services/academy.service';
import { GamificationService } from '../../../core/services/gamification.service';
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
  resetting = signal(false);
  result = signal<LessonCompleteResponse | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academyService: AcademyService,
    private gamificationService: GamificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('lessonId')!;
    this.academyService.getLesson(id).subscribe({
      next: d => { this.lesson.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get isCompleted(): boolean {
    return this.lesson()?.status === 'COMPLETED';
  }

  get backLink(): string {
    const moduleId = this.lesson()?.moduleId;
    return moduleId ? `/academy/${moduleId}` : '/academy';
  }

  complete(): void {
    if (this.completing() || this.isCompleted) return;
    this.completing.set(true);
    this.academyService.completeLesson(this.lesson()!.id).subscribe({
      next: res => {
        this.result.set(res);
        this.lesson.update(l => l ? { ...l, status: 'COMPLETED' as const } : l);
        this.completing.set(false);

        if (res.totalXpEarned > 0) {
          this.gamificationService.loadStats().subscribe();
        }
      },
      error: () => this.completing.set(false),
    });
  }

  reset(): void {
    if (this.resetting() || !this.isCompleted) return;
    this.resetting.set(true);
    this.academyService.resetLesson(this.lesson()!.id).subscribe({
      next: () => {
        this.lesson.update(l => l ? { ...l, status: 'AVAILABLE' as const } : l);
        this.result.set(null);
        this.resetting.set(false);
      },
      error: () => this.resetting.set(false),
    });
  }

  goNext(): void {
    const next = this.result()?.nextLesson;
    if (next) {
      this.router.navigate(['/academy/lesson', next.id]);
      this.result.set(null);
      this.lesson.set(next);
    } else {
      this.router.navigate([this.backLink]);
    }
  }
}