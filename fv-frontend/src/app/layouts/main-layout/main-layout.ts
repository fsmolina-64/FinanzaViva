import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  sidebarOpen = signal(true);

  navItems = [
    { path: '/dashboard',    icon: '⚡', label: 'Dashboard'   },
    { path: '/finances',     icon: '💰', label: 'Finanzas'    },
    { path: '/academy',      icon: '📚', label: 'Academia'    },
    { path: '/quizzes',      icon: '🎯', label: 'Quizzes'     },
    { path: '/simulator',    icon: '🎮', label: 'Simulador'   },
    { path: '/achievements', icon: '🏆', label: 'Logros'      },
    { path: '/profile',      icon: '👤', label: 'Perfil'      },
  ];

  constructor(
    public authService: AuthService,
    public gamificationService: GamificationService
  ) {}

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}