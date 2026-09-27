import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../state/auth.service';

// Ported from the redirect ordering of src/app/(protected)/layout.tsx and
// src/app/(auth)/layout.tsx — as functional guards (CanActivateFn) per
// Boundaries, not class-based guards. Applied per Code Map: protectedGuard on
// `/onboarding` and `/kit`, guestGuard only on `/login` (not `/callback`).
export const protectedGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.user();
  if (!user) {
    return router.parseUrl('/login');
  }

  // Decision (documented, not silent): the MVP's (protected)/layout.tsx
  // wraps /onboarding too, so its "onboarding incomplete → push('/onboarding')"
  // effect fires there as well — but that's a harmless same-route no-op in
  // Next.js's router. A CanActivateFn redirect is not a no-op: returning a
  // UrlTree starts a brand-new navigation and re-runs guards, so applying
  // this unconditionally while *evaluating* the /onboarding route itself
  // would infinite-loop instead of letting the user reach the wizard that
  // completes onboarding. Skipped only for that one route.
  const isOnboardingRoute = route.routeConfig?.path === 'onboarding';
  if (!user.onboarding_completed && !isOnboardingRoute) {
    return router.parseUrl('/onboarding');
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user() ? router.parseUrl('/kit') : true;
};
