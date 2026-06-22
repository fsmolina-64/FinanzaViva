import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OnboardingService } from '../services/onboarding.service';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas del app principal.
 * Llama al API solo una vez por sesión (null → API → cache).
 * Si cached=true: pasa. Si cached=false: redirige. Si null: verifica backend.
 */
export const onboardingGuard: CanActivateFn = async () => {
  const onboarding = inject(OnboardingService);
  const auth       = inject(AuthService);
  const router     = inject(Router);
  const cached     = onboarding.isCompleted();

  if (cached === true)  return true;
  if (cached === false) { router.navigate(['/onboarding']); return false; }

  try {
    const user      = await firstValueFrom(onboarding.fetchProfile());
    const completed = user?.profile?.onboardingCompleted ?? false;
    onboarding.cacheStatus(completed);

    if (!completed) {
      router.navigate(['/onboarding']);
      return false;
    }
    return true;
  } catch (err: any) {
    if (err?.status === 401) {
      auth.logout();
      return false;
    }
    router.navigate(['/onboarding']);
    return false;
  }
};

export const onboardingCompletedGuard: CanActivateFn = () => {
  const onboarding = inject(OnboardingService);
  const router     = inject(Router);
  if (onboarding.isCompleted() === true) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
