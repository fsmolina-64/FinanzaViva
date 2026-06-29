import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AcademyService } from '../../../core/services/academy.service';
import { QuizService } from '../../../core/services/quiz.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReadingProgressService } from '../../../core/services/reading-progress.service';
import { AcademyModule, Lesson } from '../../../core/models/academy.model';
import { Quiz, QuizHistoryEntry, QuizHistoryAnswer } from '../../../core/models/quiz.model';

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

  history = signal<QuizHistoryEntry[]>([]);
  expandedAttemptId = signal<string | null>(null);
  sortBy = signal<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  historyExpanded = signal(true);

  sortedHistory = computed(() => {
    const h = this.history();
    switch (this.sortBy()) {
      case 'oldest': return [...h].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
      case 'highest': return [...h].sort((a, b) => b.score - a.score);
      case 'lowest': return [...h].sort((a, b) => a.score - b.score);
      default: return [...h].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    }
  });

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
      next: h => {
        this.history.set(h);
        this.quizPassed.set(h.some(e => e.passed));
      },
      error: () => { }
    });
  }

  toggleAttempt(id: string): void {
    this.expandedAttemptId.update(cur => cur === id ? null : id);
  }

  getOptionHistoryState(questionId: string, optionId: string, answers: QuizHistoryAnswer[]): string {
    const answer = answers.find(a => a.questionId === questionId);
    if (!answer) return 'border-strong bg-card text-subtle';
    if (optionId === answer.correctAnswerId) return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
    if (optionId === answer.selectedAnswerId && !answer.isCorrect) return 'border-danger bg-danger/20 text-danger';
    return 'border-strong bg-card text-subtle';
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