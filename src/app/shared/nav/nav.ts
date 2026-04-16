import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, DecimalPipe],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  game = inject(GameService);

  readonly navItems = [
    { path: '/home', label: 'Inicio', icon: '🏠' },
    { path: '/dashboard', label: 'Bóveda', icon: '💎' },
    { path: '/tablero', label: 'Tablero', icon: '🎲' },
    { path: '/academia', label: 'Academia', icon: '🎓' },
    { path: '/simulador', label: 'Simulador', icon: '🌍' },
    { path: '/ranking', label: 'Ranking', icon: '🏆' },
  ];
}
