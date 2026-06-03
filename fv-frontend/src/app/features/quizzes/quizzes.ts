import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AcademyService } from '../../core/services/academy.service';
import { QuizService } from '../../core/services/quiz.service';
import { AcademyModule } from '../../core/models/academy.model';

@Component({
  selector: 'app-quizzes',
  imports: [CommonModule],
  templateUrl: './quizzes.html'
})
export class Quizzes implements OnInit {
  modules = signal<AcademyModule[]>([]);
  loading = signal(true);
  loadingId = signal<string | null>(null);

  constructor(
    private academyService: AcademyService,
    private quizService: QuizService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.academyService.getModules().subscribe({
      next: d => { this.modules.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  startQuiz(moduleId: string): void {
    if (this.loadingId()) return;
    this.loadingId.set(moduleId);
    this.quizService.getQuizByModule(moduleId).subscribe({
      next: quizzes => {
        this.loadingId.set(null);
        if (!quizzes.length) { alert('Este módulo no tiene quizzes aún.'); return; }
        this.router.navigate(['/quizzes', quizzes[0].id]);
      },
      error: () => this.loadingId.set(null)
    });
  }
}