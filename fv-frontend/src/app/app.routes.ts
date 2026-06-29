import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { GameActiveGuard } from './features/simulator/game/game-active.guard';
import { onboardingGuard, onboardingCompletedGuard } from './core/guards/onboarding.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then(m => m.Landing),
    pathMatch: 'full'
  },

  {
    path: 'auth',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then(m => m.Register)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding.component')
        .then(m => m.OnboardingComponent),
    canActivate: [authGuard, onboardingCompletedGuard],
  },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard, onboardingGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'finances',
        loadComponent: () =>
          import('./features/finances/finances').then(m => m.Finances)
      },
      {
        path: 'academy',
        loadComponent: () =>
          import('./features/academy/academy').then(m => m.Academy)
      },
      {
        path: 'academy/lesson/:lessonId',
        loadComponent: () =>
          import('./features/academy/lesson/lesson').then(m => m.LessonComponent)
      },
      {
        path: 'academy/:moduleId/quiz',
        loadComponent: () =>
          import('./features/quizzes/quiz-detail/quiz-detail').then(m => m.QuizDetail)
      },
      {
        path: 'academy/:moduleId',
        loadComponent: () =>
          import('./features/academy/module-detail/module-detail').then(m => m.ModuleDetail)
      },
      {
        path: 'simulator',
        loadComponent: () =>
          import('./features/simulator/simulator').then(m => m.Simulator)
      },
      {
        path: 'simulator/:id',
        loadComponent: () =>
          import('./features/simulator/game/game').then(m => m.Game),
        canDeactivate: [GameActiveGuard]
      },
      {
        path: 'quizzes',
        loadComponent: () =>
          import('./features/quizzes/quizzes').then(m => m.Quizzes)
      },
      {
        path: 'achievements',
        loadComponent: () =>
          import('./features/achievements/achievements').then(m => m.Achievements)
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('./features/ranking/ranking.component').then(m => m.RankingComponent)
      },
      {
        path: 'ranking/user/:id',
        loadComponent: () =>
          import('./features/ranking/user-profile-readonly/user-profile-readonly.component').then(m => m.UserProfileReadonlyComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile').then(m => m.Profile)
      }
    ]
  },

  {
    path: '**',
    redirectTo: '' // Si entran a cualquier sitio desconocido, regresan a la landing pública
  }
];