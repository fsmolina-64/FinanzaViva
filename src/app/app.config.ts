import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { ProfileService } from './services/profile.service';
import { FinanzasService } from './services/finanzas.service';

function initApp(auth: AuthService, profile: ProfileService, finanzas: FinanzasService) {
  return () => {
    // On app start, if a session exists (e.g. page refresh), reload user data
    if (auth.isLoggedIn()) {
      profile.loadForCurrentUser();
      finanzas.loadForCurrentUser();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AuthService, ProfileService, FinanzasService],
      multi: true,
    },
  ],
};
