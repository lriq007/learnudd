import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ProfileCreatorPage } from './profile-creator.page';
import { AuthService } from '../shared/state/auth.service';
import { SupabaseService } from '../shared/state/supabase.service';
import type { Note, Tutor } from '../shared/models';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    author_id: 'u1',
    title: 'Resumen Cálculo II',
    description: null,
    major: 'Ingeniería Civil Informática',
    course: 'Cálculo II',
    semester: null,
    material_type: 'resumen',
    price: 5000,
    currency: 'CLP',
    pages: null,
    file_url: null,
    cover_url: null,
    ai_declaration: 'none',
    ai_details: null,
    status: 'active',
    downloads: 12,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

function makeTutor(overrides: Partial<Tutor> = {}): Tutor {
  return {
    id: 't1',
    user_id: 'u1',
    bio: null,
    experience: null,
    hourly_price: 15000,
    campus: 'Santiago',
    modalities: ['online'],
    verified: true,
    total_classes: 8,
    created_at: '2026-01-01',
    courses: [
      { id: 'c1', tutor_id: 't1', course_name: 'Cálculo II', major: 'Ingeniería Civil Informática' },
      { id: 'c2', tutor_id: 't1', course_name: 'Física I', major: 'Ingeniería Civil Informática' },
    ],
    average_rating: 4.5,
    ...overrides,
  };
}

// Builds a SupabaseService.client stub whose `.from(table)` shape matches
// exactly the chain each of the 4 MVP queries uses (Boundaries: "Replicar
// exactamente las 4 queries del MVP"). Records the args each query's
// terminal filter was called with, so tests can assert scoping (e.g.
// bookings must be `.eq('tutor_id', tutorData.id)`) and — for the sales
// query — that the buggy `.in('note_id', [])` filter is still exactly what
// gets sent (known-issues.md#1).
function makeSupabaseStub(opts: {
  tutor?: Tutor | null;
  notes?: Note[];
  salesCount?: number;
  salesData?: Array<{ note: { price: number } | null }>;
  bookingsCount?: number;
}) {
  const { tutor = null, notes = [], salesCount = 0, salesData = [], bookingsCount = 0 } = opts;

  const calls = {
    tutorsEq: undefined as [string, unknown] | undefined,
    notesEq: undefined as [string, unknown] | undefined,
    libraryIn: undefined as [string, unknown] | undefined,
    bookingsEq: undefined as [string, unknown] | undefined,
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'tutors') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string, value: unknown) => {
              calls.tutorsEq = [field, value];
              return { single: vi.fn().mockResolvedValue({ data: tutor, error: tutor ? null : { message: 'no rows' } }) };
            }),
          })),
        };
      }
      if (table === 'notes') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string, value: unknown) => {
              calls.notesEq = [field, value];
              return { order: vi.fn().mockResolvedValue({ data: notes, error: null }) };
            }),
          })),
        };
      }
      if (table === 'library') {
        return {
          select: vi.fn(() => ({
            in: vi.fn((field: string, value: unknown) => {
              calls.libraryIn = [field, value];
              return Promise.resolve({ count: salesCount, data: salesData });
            }),
          })),
        };
      }
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string, value: unknown) => {
              calls.bookingsEq = [field, value];
              return Promise.resolve({ count: bookingsCount, data: [] });
            }),
          })),
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    }),
  };

  return { client, calls };
}

// Covers the spec's I/O matrix: "Sin perfil de tutor", "Con perfil de
// tutor", "Sin apuntes publicados", "Con apuntes".
describe('ProfileCreatorPage', () => {
  function setup(opts: {
    userId?: string | null;
    tutor?: Tutor | null;
    notes?: Note[];
    salesCount?: number;
    salesData?: Array<{ note: { price: number } | null }>;
    bookingsCount?: number;
  } = {}) {
    const authStub = { user: vi.fn().mockReturnValue(opts.userId === null ? null : { id: opts.userId ?? 'u1' }) };
    const supabaseStub = makeSupabaseStub(opts);

    TestBed.configureTestingModule({
      imports: [ProfileCreatorPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: SupabaseService, useValue: supabaseStub },
      ],
    });

    const fixture = TestBed.createComponent(ProfileCreatorPage);
    return { fixture, component: fixture.componentInstance, supabaseStub };
  }

  it('sin sesión: no consulta nada y deja de cargar', async () => {
    const { fixture, component, supabaseStub } = setup({ userId: null });

    fixture.detectChanges();
    await Promise.resolve();

    expect(supabaseStub.client.from).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('con perfil de tutor: la sección de tutor se renderiza y reservas se consulta scoped al tutor', async () => {
    const tutor = makeTutor();
    const { fixture, component, supabaseStub } = setup({ tutor, bookingsCount: 3 });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.tutorProfile()).toEqual(tutor);
    expect(supabaseStub.calls.bookingsEq).toEqual(['tutor_id', tutor.id]);
    expect(component.stats().totalBookings).toBe(3);
    expect(component.stats().averageRating).toBe(4.5);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Perfil de tutor');
    expect(text).toContain('2 ramos');
    expect(text).toContain('8 clases');
    expect(text).toContain('$15.000');
    expect(text).toContain('4.5');
    expect(fixture.nativeElement.querySelector('app-rating-stars')).toBeTruthy();
  });

  it('sin perfil de tutor: la sección de tutor no se renderiza y reservas no se consulta', async () => {
    const { fixture, component, supabaseStub } = setup({ tutor: null });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.tutorProfile()).toBeNull();
    expect(component.stats().totalBookings).toBe(0);
    expect(supabaseStub.client.from).not.toHaveBeenCalledWith('bookings');
    expect(fixture.nativeElement.textContent).not.toContain('Perfil de tutor');
  });

  it('calificación en 0 (sin tutor o tutor sin rating): el stat muestra "-"', async () => {
    const { fixture, component } = setup({ tutor: null });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.stats().averageRating).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('-');
  });

  it('con apuntes: la lista muestra título, curso, badge de estado y ventas', async () => {
    const note = makeNote({ title: 'Guía de Ejercicios EDO', course: 'Ecuaciones Diferenciales', status: 'review', downloads: 7 });
    const { fixture, component } = setup({ notes: [note] });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.notes()).toEqual([note]);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Guía de Ejercicios EDO');
    expect(text).toContain('Ecuaciones Diferenciales');
    expect(text).toContain('En revisión');
    expect(text).toContain('7 ventas');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
  });

  it('sin apuntes publicados: muestra EmptyStateComponent con CTA a /publish/note', async () => {
    const { fixture, component } = setup({ notes: [] });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.notes()).toEqual([]);
    const emptyState = fixture.nativeElement.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Aún no has publicado apuntes');
    const ctaButton = emptyState.querySelector('app-button');
    expect(ctaButton?.textContent).toContain('Publicar primer apunte');
    expect(ctaButton?.getAttribute('routerLink')).toBe('/publish/note');
  });

  it('ingresos/ventas: la query de sales usa .in(note_id, []) siempre — nunca puede matchear filas, ingresos y ventas quedan en 0 (bug replicado)', async () => {
    // Real Supabase always answers `.in('note_id', [])` with count 0 and
    // data [] (an empty IN-list matches nothing) — that's the stubbed
    // behavior here too, mirroring production; the query's OWN arguments
    // (asserted below) are what makes this the known bug, not the reduce
    // math over whatever data happens to come back.
    const { component, supabaseStub } = setup({ notes: [{ ...makeNote(), downloads: 40 }] });

    await component.ngOnInit();

    expect(supabaseStub.calls.libraryIn).toEqual(['note_id', []]);
    expect(component.stats().totalSales).toBe(0);
    expect(component.stats().totalRevenue).toBe(0);
  });

  // Boundaries: `title="Panel del creador"`, `showBack`, and a right-action
  // "Nuevo" button routing to `/publish`.
  it('header: title "Panel del creador", showBack activo y botón "Nuevo" enlazando a /publish', async () => {
    const { fixture, component } = setup({ userId: null });

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('app-header');
    expect(header?.getAttribute('title')).toBe('Panel del creador');
    // showBack is a bracket-bound input (no DOM attribute reflection) — its
    // observable effect is HeaderComponent rendering the back button.
    expect(header?.querySelector('[aria-label="Volver"]')).toBeTruthy();

    const newButton = header?.querySelector('app-button[slot="right-action"]');
    expect(newButton?.textContent).toContain('Nuevo');
    expect(newButton?.getAttribute('routerLink')).toBe('/publish');
    expect(component.loading()).toBe(false);
  });

  it('noteBadgeVariant() mapea cada status al variant de badge esperado', () => {
    const { component } = setup();

    expect(component.noteBadgeVariant('active')).toBe('success');
    expect(component.noteBadgeVariant('review')).toBe('warning');
    expect(component.noteBadgeVariant('paused')).toBe('default');
    expect(component.noteBadgeVariant('rejected')).toBe('default');
    expect(component.noteBadgeVariant('draft')).toBe('default');
  });
});
