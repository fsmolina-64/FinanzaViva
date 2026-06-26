import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AcademyService } from '../../../core/services/academy.service';
import { QuizService } from '../../../core/services/quiz.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReadingProgressService } from '../../../core/services/reading-progress.service';
import { AcademyModule, Lesson } from '../../../core/models/academy.model';
import { Quiz } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-module-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './module-detail.html'
})
export class ModuleDetail implements OnInit {
  module = signal<AcademyModule | null>(null);
  loading = signal(true);

  quiz = signal<Quiz | null>(null);
  quizLoading = signal(true);
  quizPassed = signal(false);
  readingProgress = signal(0);

  private moduleId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private academyService: AcademyService,
    private quizService: QuizService,
    private toast: ToastService,
    private readingProgressService: ReadingProgressService
  ) { }

  ngOnInit(): void {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId')!;

    this.academyService.getModule(this.moduleId).subscribe({
      next: d => {
        this.module.set(d);
        this.loading.set(false);
        this.readingProgressService.refreshProgress(this.moduleId, v => this.readingProgress.set(v));
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar el módulo'); }
    });

    this.quizService.getQuizByModule(this.moduleId).subscribe({
      next: quizzes => {
        if (quizzes.length) {
          const q = quizzes[0];
          this.quiz.set(q);
          this.loadQuizHistory(q.id);
        }
        this.quizLoading.set(false);
      },
      error: () => { this.quizLoading.set(false); this.toast.error('Error al cargar el quiz'); }
    });
  }

  private loadQuizHistory(quizId: string): void {
    this.quizService.getHistory(quizId).subscribe({
      next: history => this.quizPassed.set(history.some(h => h.passed)),
      error: () => { }
    });
  }

  quizState(): 'locked' | 'available' | 'passed' {
    if (this.quizPassed()) return 'passed';
    const m = this.module();
    if (!m || m.completedLessons < m.totalLessons) return 'locked';
    return 'available';
  }

  navigateToQuiz(): void {
    this.router.navigate(['/academy', this.moduleId, 'quiz']);
  }

  getProgress(): number {
    const m = this.module();
    if (!m || !m.totalLessons) return 0;
    return Math.round((m.completedLessons / m.totalLessons) * 100);
  }

  getLessonStatusColor(status: string): string {
    return ({
      COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      AVAILABLE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      LOCKED: 'bg-elevated text-subtle border-strong'
    } as any)[status] ?? 'bg-elevated text-subtle';
  }

  getLessonStatusLabel(status: string): string {
    return ({ COMPLETED: 'Completada', AVAILABLE: 'Disponible', LOCKED: 'Bloqueada' } as any)[status] ?? status;
  }

  canOpen(l: Lesson): boolean {
    return l.status !== 'LOCKED';
  }
}