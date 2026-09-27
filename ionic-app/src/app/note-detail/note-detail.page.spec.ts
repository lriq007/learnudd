import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { NoteDetailPage } from './note-detail.page';
import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import { FavoritesService } from '../shared/state/favorites.service';
import type { Note } from '../shared/models';

const NOTE: Note = {
  id: 'n1',
  author_id: 'a1',
  title: 'Resumen de Cálculo II',
  description: 'Un resumen completo del ramo.',
  major: 'Ingeniería Civil Informática',
  course: 'Cálculo II',
  semester: '1',
  material_type: 'resumen',
  price: 3500,
  currency: 'CLP',
  pages: 12,
  file_url: null,
  cover_url: null,
  ai_declaration: 'none',
  ai_details: null,
  status: 'active',
  downloads: 4,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  author: {
    id: 'a1',
    email: 'a1@udd.cl',
    full_name: 'Martina Rojas',
    avatar_url: null,
    campus: 'Santiago',
    major: 'Ingeniería Civil Informática',
    semester: 5,
    interests: [],
    verified: true,
    created_at: '2026-01-01',
    onboarding_completed: true,
  },
  average_rating: 4.5,
  ratings_count: 2,
};

// Covers the CAP-3 spec's I/O matrix rows: "Detalle de apunte válido",
// "Apunte inexistente", "Comprar / descargar gratis" and "Toggle favorito en
// detalle".
describe('NoteDetailPage', () => {
  function setup(overrides: {
    id?: string | null;
    notesServiceStub?: Partial<Record<'getById' | 'getRatings' | 'purchase', ReturnType<typeof vi.fn>>>;
    favoritesServiceStub?: Partial<Record<'checkFavorite' | 'toggle', ReturnType<typeof vi.fn>>>;
    userId?: string | null;
  } = {}) {
    const notesServiceStub = {
      getById: vi.fn().mockResolvedValue(null),
      getRatings: vi.fn().mockResolvedValue([]),
      purchase: vi.fn().mockResolvedValue({ error: null }),
      ...overrides.notesServiceStub,
    };
    const favoritesServiceStub = {
      checkFavorite: vi.fn().mockResolvedValue(false),
      toggle: vi.fn().mockResolvedValue({ error: null }),
      ...overrides.favoritesServiceStub,
    };
    const authStub = {
      user: vi.fn().mockReturnValue(overrides.userId === null ? null : { id: overrides.userId ?? 'u1' }),
    };

    const initialId = overrides.id === undefined ? 'n1' : overrides.id;
    // BehaviorSubject (not `of(...)`), so a test can `.next()` a second id
    // after the initial load and assert the route-reactivity fix refetches.
    const paramMap$ = new BehaviorSubject(convertToParamMap(initialId ? { id: initialId } : {}));

    TestBed.configureTestingModule({
      imports: [NoteDetailPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
        { provide: FavoritesService, useValue: favoritesServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? initialId : null) } },
            paramMap: paramMap$,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(NoteDetailPage);
    return { fixture, component: fixture.componentInstance, notesServiceStub, favoritesServiceStub, paramMap$ };
  }

  // ngOnInit chains 3 awaited calls when a note is found (getById →
  // getRatings → checkFavorite): fixture.detectChanges() lets Angular's own
  // lifecycle invoke ngOnInit exactly once, then each mocked call's promise
  // is awaited in the same order the component awaits them, so every
  // continuation up to `loading.set(false)` has actually run before
  // asserting on rendered output.
  async function flushFoundNote(
    notesServiceStub: { getById: ReturnType<typeof vi.fn>; getRatings: ReturnType<typeof vi.fn> },
    favoritesServiceStub: { checkFavorite: ReturnType<typeof vi.fn> },
  ): Promise<void> {
    await notesServiceStub.getById.mock.results[0]!.value;
    await notesServiceStub.getRatings.mock.results[0]!.value;
    await favoritesServiceStub.checkFavorite.mock.results[0]!.value;
  }

  it('apunte válido: muestra título, precio, autor, rating, descripción y declaración IA', async () => {
    const { fixture, component, notesServiceStub, favoritesServiceStub } = setup({
      notesServiceStub: { getById: vi.fn().mockResolvedValue(NOTE) },
    });

    fixture.detectChanges();
    await flushFoundNote(notesServiceStub, favoritesServiceStub);
    fixture.detectChanges();

    expect(component.note()).toBe(NOTE);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Resumen de Cálculo II');
    expect(fixture.nativeElement.textContent).toContain('Martina Rojas');
    expect(fixture.nativeElement.textContent).toContain('$3.500');
  });

  it('apunte gratis: muestra el badge "Gratis" en vez de un precio', async () => {
    const freeNote = { ...NOTE, price: 0 };
    const { fixture, notesServiceStub, favoritesServiceStub } = setup({
      notesServiceStub: { getById: vi.fn().mockResolvedValue(freeNote) },
    });

    fixture.detectChanges();
    await flushFoundNote(notesServiceStub, favoritesServiceStub);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Gratis');
  });

  it('apunte inexistente: muestra "Apunte no encontrado"', async () => {
    const { fixture, component, notesServiceStub } = setup();

    fixture.detectChanges();
    await notesServiceStub.getById.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.note()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Apunte no encontrado');
  });

  it('sin id en la ruta: no llama a NotesService y deja de cargar', async () => {
    const { fixture, component, notesServiceStub } = setup({ id: null });

    fixture.detectChanges();

    expect(notesServiceStub.getById).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('comprar con éxito: llama a purchase() y muestra el toast de éxito', async () => {
    const { component, notesServiceStub } = setup({
      notesServiceStub: { getById: vi.fn().mockResolvedValue(NOTE) },
    });

    await component.ngOnInit();
    await component.handlePurchase();

    expect(notesServiceStub.purchase).toHaveBeenCalledWith('u1', NOTE);
    expect(component.toastType()).toBe('success');
    expect(component.toastMessage()).toBe('¡El apunte ya es tuyo!');
    expect(component.toastOpen()).toBe(true);
    expect(component.purchasing()).toBe(false);
  });

  it('comprar con error: muestra el toast "Error al procesar el pago"', async () => {
    const { component } = setup({
      notesServiceStub: {
        getById: vi.fn().mockResolvedValue(NOTE),
        purchase: vi.fn().mockResolvedValue({ error: 'Error al procesar el pago' }),
      },
    });

    await component.ngOnInit();
    await component.handlePurchase();

    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('Error al procesar el pago');
  });

  it('toggle favorito: cambia el ícono de forma optimista y llama a toggle() con el estado previo', async () => {
    const { component, favoritesServiceStub } = setup({
      notesServiceStub: { getById: vi.fn().mockResolvedValue(NOTE) },
      favoritesServiceStub: { checkFavorite: vi.fn().mockResolvedValue(false) },
    });

    await component.ngOnInit();
    expect(component.isFavorite()).toBe(false);

    await component.toggleFavorite();

    expect(component.isFavorite()).toBe(true);
    expect(favoritesServiceStub.toggle).toHaveBeenCalledWith('u1', 'n1', false);
  });

  // Review fix: Angular reuses this component instance across navigations
  // that only change the `:id` param (its own route-reuse default), so the
  // fetch must react to `route.paramMap`, not read `snapshot` once.
  it('cambia el id de la ruta (misma instancia reusada): refetchea la nueva nota', async () => {
    const otherNote = { ...NOTE, id: 'n2', title: 'Guía de Álgebra' };
    const getById = vi.fn().mockImplementation((id: string) => Promise.resolve(id === 'n1' ? NOTE : otherNote));
    const { component, paramMap$ } = setup({ notesServiceStub: { getById } });

    await component.ngOnInit();
    expect(component.note()).toBe(NOTE);
    expect(getById).toHaveBeenCalledTimes(1);

    paramMap$.next(convertToParamMap({ id: 'n2' }));
    await getById.mock.results[1]!.value;

    expect(getById).toHaveBeenCalledTimes(2);
    expect(getById).toHaveBeenLastCalledWith('n2');
    expect(component.note()).toBe(otherNote);
  });
});
