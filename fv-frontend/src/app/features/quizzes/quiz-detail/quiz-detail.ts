import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { QuizService } from '../../../core/services/quiz.service';
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
  result = signal<QuizSubmitResponse | null>(null);
  history = signal<QuizHistoryEntry[]>([]);
  answers = signal<Record<string, string>>({});
  currentIndex = signal(0);
  expandedAttemptId = signal<string | null>(null);
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

  constructor(private route: ActivatedRoute, private quizService: QuizService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.quizService.getQuiz(id).subscribe({
      next: d => { this.quiz.set(d); this.loading.set(false); this.loadHistory(id); },
      error: () => this.loading.set(false)
    });
  }

  private loadHistory(id: string): void {
    this.quizService.getHistory(id).subscribe({
      next: h => this.history.set(h),
      error: () => { }
    });
  }

  selectOption(questionId: string, answerId: string): void {
    if (this.result()) return;
    this.answers.update(a => ({ ...a, [questionId]: answerId }));
  }

  next(): void {
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
      error: () => this.submitting.set(false)
    });
  }

  getOptionState(questionId: string, optionId: string): string {
    const res = this.result();
    const selected = this.answers()[questionId];
    if (!res) {
      return selected === optionId
        ? 'border-blue-500 bg-blue-500/20 text-white'
        : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500';
    }
    const qResult = res.results.find(r => r.questionId === questionId);
    if (!qResult) return 'border-slate-600 bg-slate-800 text-slate-300';
    if (optionId === qResult.correctAnswerId) return 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
    if (optionId === selected && !qResult.correct) return 'border-red-500 bg-red-500/20 text-red-300';
    return 'border-slate-600 bg-slate-800 text-slate-500';
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
}