import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AcademyService } from '../../../core/services/academy.service';
import { AcademyModule, Lesson } from '../../../core/models/academy.model';

@Component({
  selector: 'app-module-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './module-detail.html'
})
export class ModuleDetail implements OnInit {
  module = signal<AcademyModule | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private academyService: AcademyService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('moduleId')!;
    this.academyService.getModule(id).subscribe({
      next: d => { this.module.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
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
      LOCKED: 'bg-slate-700 text-slate-500 border-slate-600'
    } as any)[status] ?? 'bg-slate-700 text-slate-500';
  }

  getLessonStatusLabel(status: string): string {
    return ({ COMPLETED: 'Completada', AVAILABLE: 'Disponible', LOCKED: 'Bloqueada' } as any)[status] ?? status;
  }

  canOpen(l: Lesson): boolean {
    return l.status !== 'LOCKED';
  }
}