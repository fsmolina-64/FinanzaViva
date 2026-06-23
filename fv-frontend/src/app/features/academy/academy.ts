import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AcademyService } from '../../core/services/academy.service';
import { ToastService } from '../../core/services/toast.service';
import { AcademyModule } from '../../core/models/academy.model';

@Component({
  selector: 'app-academy',
  imports: [CommonModule, RouterModule],
  templateUrl: './academy.html',
  styleUrl: './academy.css'
})
export class Academy implements OnInit {
  modules = signal<AcademyModule[]>([]);
  loading = signal(true);

  constructor(
    private academyService: AcademyService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.academyService.getModules().subscribe({
      next: d => { this.modules.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar los módulos'); }
    });
  }

  getProgress(m: AcademyModule): number {
    if (!m.totalLessons) return 0;
    return Math.round((m.completedLessons / m.totalLessons) * 100);
  }

  getProgressColor(p: number): string {
    if (p === 100) return 'from-emerald-500 to-emerald-400';
    if (p >= 50) return 'from-blue-500 to-blue-400';
    return 'from-muted to-subtle';
  }

  getStatusLabel(m: AcademyModule): string {
    if (m.completedLessons === m.totalLessons && m.totalLessons > 0) return 'Completado';
    if (m.completedLessons > 0) return 'En progreso';
    return 'Disponible';
  }

  getStatusColor(m: AcademyModule): string {
    if (m.completedLessons === m.totalLessons && m.totalLessons > 0)
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (m.completedLessons > 0)
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-muted/20 text-muted border-strong';
  }
}