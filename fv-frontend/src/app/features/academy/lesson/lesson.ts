import { Component, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { AcademyService } from '../../../core/services/academy.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReadingProgressService } from '../../../core/services/reading-progress.service';
import { ContentBlock, Lesson, LessonCompleteResponse } from '../../../core/models/academy.model';

@Component({
  selector: 'app-lesson',
  imports: [CommonModule, RouterModule],
  templateUrl: './lesson.html'
})
export class LessonComponent implements OnInit, OnDestroy {
  lesson = signal<Lesson | null>(null);
  loading = signal(true);
  completing = signal(false);
  result = signal<LessonCompleteResponse | null>(null);
  revealedHints = signal<Set<number>>(new Set());
  scrollProgress = signal(0);
  moduleReadingProgress = signal(0);
  private destroy$ = new Subject<void>();

  exerciseIndices = computed(() => {
    const map = new Map<number, number>();
    let count = 0;
    this.lesson()?.content.forEach((block, index) => {
      if (block.type === 'exercise') map.set(index, ++count);
    });
    return map;
  });

  conceptCount = computed(() =>
    this.lesson()?.content.filter(b => b.type === 'key_concept').length ?? 0
  );

  exerciseCount = computed(() =>
    this.lesson()?.content.filter(b => b.type === 'exercise').length ?? 0
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academyService: AcademyService,
    private gamificationService: GamificationService,
    private toast: ToastService,
    private readingProgressService: ReadingProgressService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params.get('lessonId')!;
        this.loading.set(true);
        this.lesson.set(null);
        this.result.set(null);
        this.revealedHints.set(new Set());
        this.scrollProgress.set(0);
        return this.academyService.getLesson(id);
      }),
    ).subscribe({
      next: d => {
        this.lesson.set(d);
        this.loading.set(false);
        this.readingProgressService.refreshProgress(d.moduleId, v => this.moduleReadingProgress.set(v));
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar la lección'); }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    this.scrollProgress.set(Math.min(100, progress));
  }

  get isCompleted(): boolean {
    return this.lesson()?.status === 'COMPLETED';
  }

  get backLink(): string {
    const moduleId = this.lesson()?.moduleId;
    return moduleId ? `/academy/${moduleId}` : '/academy';
  }

  toggleHint(index: number): void {
    const current = new Set(this.revealedHints());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.revealedHints.set(current);
  }

  isHintVisible(index: number): boolean {
    return this.revealedHints().has(index);
  }

  getComparisonRows(block: ContentBlock): { left: string; right: string }[] {
    const left = block.leftItems ?? [];
    const right = block.rightItems ?? [];
    const len = Math.max(left.length, right.length);
    return Array.from({ length: len }, (_, i) => ({
      left: left[i] ?? '',
      right: right[i] ?? '',
    }));
  }

  complete(): void {
    if (this.completing() || this.isCompleted) return;
    this.completing.set(true);
    this.academyService.completeLesson(this.lesson()!.id).subscribe({
      next: res => {
        this.result.set(res);
        this.lesson.update(l => l ? { ...l, status: 'COMPLETED' as const } : l);
        this.completing.set(false);
        this.toast.success('Lección completada');
        const lesson = this.lesson();
        if (lesson) {
          this.readingProgressService.refreshProgress(lesson.moduleId, v => this.moduleReadingProgress.set(v));
        }
        if (res.totalXpEarned > 0) {
          this.gamificationService.loadStats().subscribe();
        }
      },
      error: () => { this.completing.set(false); this.toast.error('Error al completar la lección'); }
    });
  }

  goNext(): void {
    const next = this.result()?.nextLesson;
    if (!next?.id) {
      this.router.navigateByUrl(this.backLink);
      return;
    }
    this.router.navigateByUrl(`/academy/lesson/${next.id}`);
  }
}