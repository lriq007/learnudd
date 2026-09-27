import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { routes } from './app.routes';
import { AuthService } from './shared/state/auth.service';
import { NotesService } from './shared/state/notes.service';
import { FavoritesService } from './shared/state/favorites.service';
import { TutorsService } from './shared/state/tutors.service';
import { BookingsService } from './shared/state/bookings.service';
import { NoteDetailPage } from './note-detail/note-detail.page';
import { LibraryPage } from './library/library.page';
import { PublishPage } from './publish/publish.page';
import { PublishNotePage } from './publish-note/publish-note.page';
import { PublishTutorPage } from './publish-tutor/publish-tutor.page';
import { TutorDetailPage } from './tutor-detail/tutor-detail.page';
import { BookingsPage } from './bookings/bookings.page';
import { MessagesPage } from './messages/messages.page';
import { ChatPage } from './chat/chat.page';
import { MessagesService } from './shared/state/messages.service';
import { ProfilePage } from './profile/profile.page';
import { ProfileCreatorPage } from './profile-creator/profile-creator.page';

// Review fix: every other spec provides `provideRouter([])` (an empty route
// table) or stubs `ActivatedRoute` directly, so nothing previously resolved
// `explore/notes/:id`/`library` against the real exported `routes` array — a
// typo in either path string or a dropped `canActivate` would ship
// undetected while still passing every other test in the suite.
describe('app.routes', () => {
  function setup(user: unknown) {
    const authStub = { user: vi.fn().mockReturnValue(user) };
    const notesServiceStub = {
      getById: vi.fn().mockResolvedValue(null),
      getRatings: vi.fn().mockResolvedValue([]),
      listPurchased: vi.fn().mockResolvedValue([]),
    };
    const favoritesServiceStub = { checkFavorite: vi.fn().mockResolvedValue(false) };
    const tutorsServiceStub = { getById: vi.fn().mockResolvedValue(null) };
    const bookingsServiceStub = {
      getSchedules: vi.fn().mockResolvedValue([]),
      getRatings: vi.fn().mockResolvedValue([]),
      listForStudent: vi.fn().mockResolvedValue([]),
    };
    const messagesServiceStub = {
      listConversations: vi.fn().mockResolvedValue([]),
      listForConversation: vi.fn().mockResolvedValue([]),
      markRead: vi.fn().mockResolvedValue(undefined),
      subscribeToConversation: vi.fn().mockReturnValue(null),
      unsubscribe: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
        { provide: FavoritesService, useValue: favoritesServiceStub },
        { provide: TutorsService, useValue: tutorsServiceStub },
        { provide: BookingsService, useValue: bookingsServiceStub },
        { provide: MessagesService, useValue: messagesServiceStub },
      ],
    });

    return { router: TestBed.inject(Router) };
  }

  it('usuario autenticado: /library activa LibraryPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/library');

    expect(component).toBeInstanceOf(LibraryPage);
  });

  it('usuario autenticado: /explore/notes/:id activa NoteDetailPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/explore/notes/n1');

    expect(component).toBeInstanceOf(NoteDetailPage);
  });

  it('sin sesión: /library redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/library');

    expect(router.url).toBe('/login');
  });

  it('sin sesión: /explore/notes/:id redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/explore/notes/n1');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /publish activa PublishPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/publish');

    expect(component).toBeInstanceOf(PublishPage);
  });

  it('sin sesión: /publish redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/publish');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /publish/note activa PublishNotePage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/publish/note');

    expect(component).toBeInstanceOf(PublishNotePage);
  });

  it('sin sesión: /publish/note redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/publish/note');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /publish/tutor activa PublishTutorPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/publish/tutor');

    expect(component).toBeInstanceOf(PublishTutorPage);
  });

  it('sin sesión: /publish/tutor redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/publish/tutor');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /explore/tutors/:id activa TutorDetailPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/explore/tutors/t1');

    expect(component).toBeInstanceOf(TutorDetailPage);
  });

  it('sin sesión: /explore/tutors/:id redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/explore/tutors/t1');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /bookings activa BookingsPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/bookings');

    expect(component).toBeInstanceOf(BookingsPage);
  });

  it('sin sesión: /bookings redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/bookings');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /messages activa MessagesPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/messages');

    expect(component).toBeInstanceOf(MessagesPage);
  });

  it('sin sesión: /messages redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/messages');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /messages/:userId activa ChatPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/messages/u2');

    expect(component).toBeInstanceOf(ChatPage);
  });

  it('sin sesión: /messages/:userId redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/messages/u2');

    expect(router.url).toBe('/login');
  });

  it('usuario autenticado: /profile activa ProfilePage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/profile');

    expect(component).toBeInstanceOf(ProfilePage);
  });

  it('sin sesión: /profile redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/profile');

    expect(router.url).toBe('/login');
  });

  // spec-cap-6-creator-dashboard: was falling into the `**` catch-all
  // (redirectTo 'kit') before this spec registered the route — this guards
  // against that regressing silently.
  it('usuario autenticado: /profile/creator activa ProfileCreatorPage', async () => {
    setup({ id: 'u1', onboarding_completed: true });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/profile/creator');

    expect(component).toBeInstanceOf(ProfileCreatorPage);
  });

  it('sin sesión: /profile/creator redirige a /login (protectedGuard)', async () => {
    const { router } = setup(null);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/profile/creator');

    expect(router.url).toBe('/login');
  });
});
