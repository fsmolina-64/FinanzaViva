import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

const requireAuth: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/auth']);
};

const requireGuest: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return !auth.isLoggedIn() ? true : router.createUrlTree(['/home']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [requireGuest],
    loadComponent: () => import('./Inicio de seción/auth').then(m => m.Auth),
    title: 'FinanzaViva — Acceder',
  },
  {
    path: 'home',
    canActivate: [requireAuth],
    loadComponent: () => import('./home/home').then(m => m.Home),
    title: 'FinanzaViva — Inicio',
  },
  {
    path: 'tablero',
    canActivate: [requireAuth],
    loadComponent: () => import('./tablero/tablero').then(m => m.Tablero),
    title: 'FinanzaViva — El Tablero',
  },
  {
    path: 'academia',
    canActivate: [requireAuth],
    loadComponent: () => import('./academia/academia').then(m => m.Academia),
    title: 'FinanzaViva — Academia',
  },
  {
    path: 'finanzas',
    canActivate: [requireAuth],
    loadComponent: () => import('./finanzas/finanzas').then(m => m.Finanzas),
    title: 'FinanzaViva — Mis Finanzas',
  },
  {
    path: 'perfil',
    canActivate: [requireAuth],
    loadComponent: () => import('./perfil/perfil').then(m => m.Perfil),
    title: 'FinanzaViva — Mi Perfil',
  },
  { path: '**', redirectTo: 'auth' },
];
