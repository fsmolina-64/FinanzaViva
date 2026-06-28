import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import { RANK_LABEL_MAP } from '../../shared/pipes/rank-label.pipe';
import { ToastComponent } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule, CommonModule, ToastComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  sidebarOpen = signal(true);

  navItems = [
    { path: '/dashboard', icon: 'dashboard.png', label: 'Dashboard' },
    { path: '/finances', icon: 'billetera-premium.png', label: 'Finanzas' },
    { path: '/academy', icon: 'academia.png', label: 'Academia' },
    { path: '/simulator', icon: 'simulador.png', label: 'Simulador' },
    { path: '/achievements', icon: 'logro.png', label: 'Logros' },
    { path: '/ranking', icon: '/ranking.png', label: 'Ranking' },
    { path: '/profile', icon: 'perfil.png', label: 'Perfil' },
  ];

  constructor(
    public authService: AuthService,
    public gamificationService: GamificationService
  ) { }

  ngOnInit(): void {
    if (this.authService.currentUser()) {
      this.gamificationService.loadStats().subscribe();
    }
  }

  getRankLabel(rank: string): string {
    return RANK_LABEL_MAP[rank] ?? rank;
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}