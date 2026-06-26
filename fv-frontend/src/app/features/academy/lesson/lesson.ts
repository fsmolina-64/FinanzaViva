import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
export class LessonComponent implements OnInit {
  lesson = signal<Lesson | null>(null);
  loading = signal(true);
  completing = signal(false);
  resetting = signal(false);
  result = signal<LessonCompleteResponse | null>(null);
  revealedHints = signal<Set<number>>(new Set());
  scrollProgress = signal(0);
  moduleReadingProgress = signal(0);

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
    const id = this.route.snapshot.paramMap.get('lessonId')!;
    this.academyService.getLesson(id).subscribe({
      next: d => {
        this.lesson.set(d);
        this.loading.set(false);
        this.readingProgressService.refreshProgress(d.moduleId, v => this.moduleReadingProgress.set(v));
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar la lección'); }
    });
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

  reset(): void {
    if (this.resetting() || !this.isCompleted) return;
    this.resetting.set(true);
    this.academyService.resetLesson(this.lesson()!.id).subscribe({
      next: () => {
        this.lesson.update(l => l ? { ...l, status: 'AVAILABLE' as const } : l);
        this.result.set(null);
        this.revealedHints.set(new Set());
        this.resetting.set(false);
        this.toast.info('Progreso de la lección reiniciado');
      },
      error: () => { this.resetting.set(false); this.toast.error('Error al reiniciar la lección'); }
    });
  }

  goNext(): void {
    const next = this.result()?.nextLesson;
    if (next) {
      this.router.navigate(['/academy/lesson', next.id]);
      this.result.set(null);
      this.lesson.set(next);
      this.revealedHints.set(new Set());
      this.scrollProgress.set(0);
      window.scrollTo(0, 0);
    } else {
      this.router.navigate([this.backLink]);
    }
  }
}