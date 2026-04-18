import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  auth = inject(AuthService);
  profile = inject(ProfileService);

  menuOpen = false;

  readonly navLinks = [
    { path: '/home',     label: 'Inicio',   icon: '🏠' },
    { path: '/tablero',  label: 'Tablero',  icon: '🎲' },
    { path: '/academia', label: 'Academia', icon: '🎓' },
    { path: '/finanzas', label: 'Finanzas', icon: '💳' },
  ];

  logout() { this.auth.logout(); }
}
