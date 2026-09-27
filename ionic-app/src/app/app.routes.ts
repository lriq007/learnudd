import { Routes } from '@angular/router';

import { guestGuard, protectedGuard } from './shared/guards/auth.guard';

// CAP-1 added the 3 auth/onboarding flows on top of CAP-7's /kit route.
// CAP-2 adds the real product home/explore/favorites: '' (home) replaces
// the CAP-1 temporary redirect to /kit per this spec's Approach; /kit stays
// registered as-is (the UI-kit demo page), still behind protectedGuard.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    // No guard: shared callback destination for both password and magic-link
    // flows, per Boundaries ("callback OAuth" in the SPEC madre refers to
    // this page, not a new social login).
    path: 'callback',
    loadComponent: () => import('./auth/callback/callback.page').then((m) => m.CallbackPage),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then((m) => m.OnboardingPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'kit',
    loadComponent: () => import('./kit/kit.page').then((m) => m.KitPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'explore',
    loadComponent: () => import('./explore/explore.page').then((m) => m.ExplorePage),
    canActivate: [protectedGuard],
  },
  {
    path: 'favorites',
    loadComponent: () => import('./favorites/favorites.page').then((m) => m.FavoritesPage),
    canActivate: [protectedGuard],
  },
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [protectedGuard],
    pathMatch: 'full',
  },
  {
    // Header/Navbar link to domain routes (/messages, /library, /profile,
    // /publish) that this spec doesn't create yet — catch them here instead
    // of letting the router throw "cannot match any routes". Kept pointed
    // at /kit per Code Map ("kit sigue existiendo tal cual") — this spec's
    // Code Map doesn't ask to retarget the wildcard itself.
    path: '**',
    redirectTo: 'kit',
  },
];
