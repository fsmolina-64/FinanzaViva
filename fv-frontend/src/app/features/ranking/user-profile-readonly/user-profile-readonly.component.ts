import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { fadeInUp } from '../../../core/animations/animations';
import { environment } from '../../../../environments/environment';

interface Breakdown {
  activity: number;
  consistency: number;
  academic: number;
  simulator: number;
  achievements: number;
  xp: number;
}

interface RankingUser {
  position: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: string;
  level: number;
  score: number;
  breakdown: Breakdown;
}

@Component({
  selector: 'app-user-profile-readonly',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile-readonly.component.html',
  styleUrl: './user-profile-readonly.component.css',
  animations: [
    fadeInUp,
    trigger('barAnimation', [
      transition(':enter', [
        query('.progress-bar', [
          style({ width: '0%' }),
          stagger('80ms', [
            animate('600ms ease-out', style({ width: '*%' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class UserProfileReadonlyComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  userData = signal<RankingUser | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  loaded = signal(false);

  readonly breakdownLabels: { key: keyof Breakdown; label: string }[] = [
    { key: 'activity', label: 'Actividad' },
    { key: 'consistency', label: 'Consistencia' },
    { key: 'academic', label: 'Acad&eacute;mico' },
    { key: 'simulator', label: 'Simulador' },
    { key: 'achievements', label: 'Logros' },
    { key: 'xp', label: 'XP' },
  ];

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.error.set('Usuario no encontrado.');
      this.loading.set(false);
      return;
    }
    this.http.get<RankingUser>(`${environment.apiUrl}/ranking/user/${userId}`).subscribe({
      next: (data) => {
        this.userData.set(data);
        this.loading.set(false);
        setTimeout(() => this.loaded.set(true), 100);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el perfil del usuario.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/ranking']);
  }
}
