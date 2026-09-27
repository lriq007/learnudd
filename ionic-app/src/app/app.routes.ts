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
    // CAP-3: NoteCard (CAP-2) already links here; was falling into the
    // catch-all below until this spec built the page.
    path: 'explore/notes/:id',
    loadComponent: () => import('./note-detail/note-detail.page').then((m) => m.NoteDetailPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-3: Header's cart icon (CAP-7/CAP-2) already links here; was
    // falling into the catch-all below until this spec built the page.
    path: 'library',
    loadComponent: () => import('./library/library.page').then((m) => m.LibraryPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-3 (resto, spec-cap-3-publish-note): Navbar's central "+" button
    // (publishHref, CAP-7) already links here; was falling into the
    // catch-all below until this spec built the chooser page.
    path: 'publish',
    loadComponent: () => import('./publish/publish.page').then((m) => m.PublishPage),
    canActivate: [protectedGuard],
  },
  {
    path: 'publish/note',
    loadComponent: () => import('./publish-note/publish-note.page').then((m) => m.PublishNotePage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-4 (resto, spec-cap-4-publish-tutor): the chooser's "Ofrecer clases"
    // card (CAP-3 resto) already links here; was falling into the catch-all
    // below until this spec built the form page.
    path: 'publish/tutor',
    loadComponent: () => import('./publish-tutor/publish-tutor.page').then((m) => m.PublishTutorPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-4: TutorCard (CAP-2) already links here; was falling into the
    // catch-all below until this spec built the page.
    path: 'explore/tutors/:id',
    loadComponent: () => import('./tutor-detail/tutor-detail.page').then((m) => m.TutorDetailPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-4: registered per Code Map/Design Notes even though no in-app nav
    // link points here yet — CAP-6 (Profile) adds the "Mis reservas" menu
    // item, same accepted pattern as /publish/note before its chooser
    // existed.
    path: 'bookings',
    loadComponent: () => import('./bookings/bookings.page').then((m) => m.BookingsPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-5: Navbar's "Mensajes" tab (CAP-7), Header's notifications icon
    // (CAP-7) and tutor-detail's message button (CAP-4) already link here;
    // was falling into the catch-all below until this spec built the page.
    path: 'messages',
    loadComponent: () => import('./messages/messages.page').then((m) => m.MessagesPage),
    canActivate: [protectedGuard],
  },
  {
    // CAP-5: BookingsPage's "Chat" button (CAP-4) already links here.
    // `:userId` (not `:id`) identifies the OTHER USER in this chat, not a
    // conversation or message id — no `conversations` table exists (Design
    // Notes).
    path: 'messages/:userId',
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
    canActivate: [protectedGuard],
  },
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [protectedGuard],
    pathMatch: 'full',
  },
  {
    // CAP-6: Navbar's "Perfil" tab (CAP-7) already links here; was falling
    // into the catch-all below until this spec built the page. Only
    // /profile/creator (out of scope, deferred-work.md) stays uncaught.
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [protectedGuard],
  },
  {
    // Header/Navbar link to domain routes that this spec doesn't create yet
    // — catch them here instead of letting the router throw "cannot match
    // any routes". Kept pointed at /kit per Code Map ("kit sigue existiendo
    // tal cual") — this spec's Code Map doesn't ask to retarget the wildcard
    // itself. CAP-3: /library and /explore/notes/:id are real routes now
    // (registered above), no longer caught here. CAP-3 (resto,
    // spec-cap-3-publish-note): /publish and /publish/note are real routes
    // too now. CAP-4: /explore/tutors/:id and /bookings are real routes too
    // now (registered above), no longer caught here. CAP-4 (resto,
    // spec-cap-4-publish-tutor): /publish/tutor ("Ofrecer clases") is a real
    // route too now (registered above), no longer caught here. CAP-5:
    // /messages and /messages/:userId are real routes too now (registered
    // above), no longer caught here. CAP-6: /profile is a real route too now
    // (registered above), no longer caught here — only /profile/creator
    // (out of scope) still falls through to this catch-all.
    path: '**',
    redirectTo: 'kit',
  },
];
