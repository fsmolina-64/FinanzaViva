import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.Home),
    title: 'FinanzaPro — Inicio',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    title: 'FinanzaPro — La Bóveda',
  },
  {
    path: 'tablero',
    loadComponent: () => import('./tablero/tablero').then(m => m.Tablero),
    title: 'FinanzaPro — El Tablero',
  },
  {
    path: 'academia',
    loadComponent: () => import('./academia/academia').then(m => m.Academia),
    title: 'FinanzaPro — La Academia',
  },
  {
    path: 'simulador',
    loadComponent: () => import('./simulador/simulador').then(m => m.Simulador),
    title: 'FinanzaPro — Simulador de Vida',
  },
  {
    path: 'ranking',
    loadComponent: () => import('./ranking/ranking').then(m => m.Ranking),
    title: 'FinanzaPro — Ranking Global',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
