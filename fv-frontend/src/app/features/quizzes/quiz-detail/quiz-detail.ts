import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
import { ToastService } from '../../../core/services/toast.service';
import { Quiz, QuizQuestion, QuizSubmitResponse, QuizHistoryEntry } from '../../../core/models/quiz.model';

@Component({
  selector: 'app-quiz-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz-detail.html'
})
export class QuizDetail implements OnInit {
  quiz = signal<Quiz | null>(null);
  loading = signal(true);
  submitting = signal(false);
  notFound = signal(false);
  result = signal<QuizSubmitResponse | null>(null);
  history = signal<QuizHistoryEntry[]>([]);
  answers = signal<Record<string, string>>({});
  currentIndex = signal(0);
  expandedAttemptId = signal<string | null>(null);
  backLink = '/academy';
  protected Object = Object;

  currentQuestion = computed<QuizQuestion | null>(() => {
    const q = this.quiz();
    if (!q) return null;
    return q.questions[this.currentIndex()] ?? null;
  });

  allAnswered = computed(() => {
    const q = this.quiz();
    if (!q) return false;
    return q.questions.every(qq => !!this.answers()[qq.id]);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    const moduleId = this.route.snapshot.paramMap.get('moduleId')!;
    this.backLink = `/academy/${moduleId}`;

    this.quizService.getQuizByModule(moduleId).subscribe({
      next: quizzes => {
        if (!quizzes.length) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        const q = quizzes[0];
        this.quiz.set(q);
        this.loading.set(false);
        this.loadHistory(q.id);
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar el quiz'); }
    });
  }

  private loadHistory(quizId: string): void {
    this.quizService.getHistory(quizId).subscribe({
      next: h => this.history.set(h),
      error: () => { }
    });
  }

  selectOption(questionId: string, answerId: string): void {
    if (this.result()) return;
    this.answers.update(a => ({ ...a, [questionId]: answerId }));
  }

  next(): void {
    const q = this.currentQuestion();
    if (q && !this.answers()[q.id]) {
      this.toast.warning('Responde esta pregunta antes de continuar');
      return;
    }
    if (this.currentIndex() < (this.quiz()?.questions.length ?? 1) - 1)
      this.currentIndex.update(i => i + 1);
  }

  prev(): void {
    if (this.currentIndex() > 0) this.currentIndex.update(i => i - 1);
  }

  submit(): void {
    if (!this.allAnswered() || this.submitting()) return;
    this.submitting.set(true);
    const payload = {
      answers: Object.entries(this.answers()).map(([questionId, answerId]) => ({ questionId, answerId })),
      timeTaken: 0
    };
    this.quizService.submitQuiz(this.quiz()!.id, payload).subscribe({
      next: res => { this.result.set(res); this.submitting.set(false); },
      error: () => { this.submitting.set(false); this.toast.error('Error al enviar el quiz'); }
    });
  }

  getOptionState(questionId: string, optionId: string): string {
    const res = this.result();
    const selected = this.answers()[questionId];
    if (!res) {
      return selected === optionId
        ? 'border-primary bg-primary/20 text-app'
        : 'border-strong bg-card text-muted hover:border-strong';
    }
    const qResult = res.results.find(r => r.questionId === questionId);
    if (!qResult) return 'border-strong bg-card text-muted';
    if (optionId === qResult.correctAnswerId) return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
    if (optionId === selected && !qResult.correct) return 'border-danger bg-danger/20 text-danger';
    return 'border-strong bg-card text-subtle';
  }

  isQuestionCorrect(questionId: string): boolean {
    return this.result()?.results.find(r => r.questionId === questionId)?.correct ?? false;
  }

  getExplanation(questionId: string): string {
    return this.result()?.results.find(r => r.questionId === questionId)?.explanation ?? '';
  }

  toggleAttempt(id: string): void {
    this.expandedAttemptId.update(cur => cur === id ? null : id);
  }

  restart(): void {
    this.answers.set({});
    this.result.set(null);
    this.currentIndex.set(0);
    this.loadHistory(this.quiz()!.id);
  }

  goBack(): void {
    this.router.navigateByUrl(this.backLink);
  }
}