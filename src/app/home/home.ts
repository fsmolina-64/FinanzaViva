import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../services/profile.service';
import { FinanzasService } from '../services/finanzas.service';
import { AuthService } from '../services/auth.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  profile = inject(ProfileService);
  finanzas = inject(FinanzasService);
  auth = inject(AuthService);

  readonly quickActions = [
    { icon: '🎲', label: 'Jugar Tablero', sub: 'Multijugador', route: '/tablero', color: '#10B981' },
    { icon: '🎓', label: 'Academia', sub: 'Quizzes financieros', route: '/academia', color: '#8B5CF6' },
    { icon: '💳', label: 'Mis Finanzas', sub: 'Ingresos y gastos', route: '/finanzas', color: '#F59E0B' },
    { icon: '👤', label: 'Mi Perfil', sub: 'Estadísticas y logros', route: '/perfil', color: '#06B6D4' },
  ];

  readonly achievements = [
    { id: 'first_login', label: 'Primer paso', icon: '👣', desc: 'Iniciaste sesión por primera vez' },
    { id: 'first_quiz',  label: 'Estudiante',  icon: '📖', desc: 'Completaste tu primer quiz' },
    { id: 'first_mov',   label: 'Contable',    icon: '📊', desc: 'Registraste un movimiento' },
    { id: 'board_lap',   label: 'Una vuelta',  icon: '🎲', desc: 'Completaste una vuelta al tablero' },
    { id: 'level_3',     label: 'Nivel 3',     icon: '⭐', desc: 'Alcanzaste el nivel 3' },
    { id: 'rich',        label: 'Acaudalado',  icon: '💰', desc: 'Tienes más de 5,000 monedas' },
  ];

  ngOnInit() {
    // Ensure data is loaded if user refreshes the page
    if (!this.profile.profile()) {
      this.profile.loadForCurrentUser();
      this.finanzas.loadForCurrentUser();
    }
    this.profile.unlockAchievement('first_login');
    const coins = this.profile.profile()?.coins ?? 0;
    const level = this.profile.profile()?.level ?? 0;
    if (coins >= 5000) this.profile.unlockAchievement('rich');
    if (level >= 3)    this.profile.unlockAchievement('level_3');
  }

  isUnlocked(id: string): boolean {
    return this.profile.profile()?.achievementsUnlocked.includes(id) ?? false;
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return '¡Buenos días';
    if (h < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  get firstName(): string {
    const name = this.profile.profile()?.name?.trim();
    return name ? name.split(/\s+/)[0] : 'amigo';
  }

  get recentMovs() {
    return this.finanzas.movimientos().slice(0, 4);
  }
}
