import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { routes } from './app.routes';
import { AuthService } from './shared/state/auth.service';
import { NotesService } from './shared/state/notes.service';
import { FavoritesService } from './shared/state/favorites.service';
import { NoteDetailPage } from './note-detail/note-detail.page';
import { LibraryPage } from './library/library.page';

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

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
        { provide: FavoritesService, useValue: favoritesServiceStub },
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
});
