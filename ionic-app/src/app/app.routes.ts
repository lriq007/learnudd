import { Routes } from '@angular/router';

import { guestGuard, protectedGuard } from './shared/guards/auth.guard';

// CAP-1 adds the 3 auth/onboarding flows on top of CAP-7's /kit route.
// /kit stays the temporary post-login/post-onboarding destination until a
// real home exists (CAP-2), now behind protectedGuard per Boundaries.
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
    path: '',
    redirectTo: 'kit',
    pathMatch: 'full',
  },
  {
    path: 'publish/tutor',
    loadComponent: () => import('./publish-tutor/publish-tutor.page').then((m) => m.PublishTutorPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'explore/tutors/:id',
    loadComponent: () => import('./tutor-detail/tutor-detail.page').then((m) => m.TutorDetailPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'bookings',
    loadComponent: () => import('./bookings/bookings.page').then((m) => m.BookingsPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.page').then((m) => m.MessagesPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'messages/:userId',
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [protectedGuard],
  },
  {
    path: 'profile/creator',
    loadComponent: () => import('./profile-creator/profile-creator.page').then((m) => m.ProfileCreatorPage),
    canActivate: [protectedGuard],
  },
  {
    // Header/Navbar link to domain routes (/messages, /library, /explore,
    // /profile, /publish, /) that this spec doesn't create yet — catch them
    // here instead of letting the router throw "cannot match any routes".
    path: '**',
    redirectTo: 'kit',
  },
];
