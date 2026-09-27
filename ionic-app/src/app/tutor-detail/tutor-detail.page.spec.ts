import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { TutorDetailPage } from './tutor-detail.page';
import { AuthService } from '../shared/state/auth.service';
import { TutorsService } from '../shared/state/tutors.service';
import { BookingsService } from '../shared/state/bookings.service';
import type { Tutor, TutorRating, TutorSchedule } from '../shared/models';

const TUTOR: Tutor = {
  id: 't1',
  user_id: 'u-tutor',
  bio: 'Ayudo con Cálculo y Álgebra.',
  experience: '3 años',
  hourly_price: 15000,
  campus: 'Santiago',
  modalities: ['online', 'presencial'],
  verified: true,
  total_classes: 42,
  created_at: '2026-01-01',
  user: {
    id: 'u-tutor',
    email: 'tutor@udd.cl',
    full_name: 'Diego Fuentes',
    avatar_url: null,
    campus: 'Santiago',
    major: 'Ingeniería Civil Informática',
    semester: 8,
    interests: [],
    verified: true,
    created_at: '2026-01-01',
    onboarding_completed: true,
  },
  courses: [{ id: 'c1', tutor_id: 't1', course_name: 'Cálculo II', major: 'Ingeniería Civil Informática' }],
  average_rating: 4.8,
  ratings_count: 10,
};

const SCHEDULE: TutorSchedule = {
  id: 's1',
  tutor_id: 't1',
  date: '2026-10-05',
  start_time: '10:00:00',
  end_time: '11:00:00',
  available: true,
  recurring: false,
  created_at: '2026-01-01',
};

const RATING: TutorRating = {
  id: 'r1',
  user_id: 'u2',
  tutor_id: 't1',
  rating: 5,
  comment: 'Excelente tutor.',
  verified_class: true,
  created_at: '2026-01-01',
  user: {
    id: 'u2',
    email: 'u2@udd.cl',
    full_name: 'Martina Rojas',
    avatar_url: null,
    campus: 'Santiago',
    major: 'Derecho',
    semester: 3,
    interests: [],
    verified: false,
    created_at: '2026-01-01',
    onboarding_completed: true,
  },
};

// Covers the CAP-4 spec's I/O matrix rows: "Perfil de tutor válido", "Tutor
// inexistente", "Reservar horario", "Sin horario seleccionado".
describe('TutorDetailPage', () => {
  function setup(overrides: {
    id?: string | null;
    tutorsServiceStub?: Partial<Record<'getById', ReturnType<typeof vi.fn>>>;
    bookingsServiceStub?: Partial<Record<'getSchedules' | 'getRatings' | 'create', ReturnType<typeof vi.fn>>>;
    userId?: string | null;
  } = {}) {
    const tutorsServiceStub = {
      getById: vi.fn().mockResolvedValue(null),
      ...overrides.tutorsServiceStub,
    };
    const bookingsServiceStub = {
      getSchedules: vi.fn().mockResolvedValue([]),
      getRatings: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ error: null }),
      ...overrides.bookingsServiceStub,
    };
    const authStub = {
      user: vi.fn().mockReturnValue(overrides.userId === null ? null : { id: overrides.userId ?? 'u1' }),
    };

    const initialId = overrides.id === undefined ? 't1' : overrides.id;
    const paramMap$ = new BehaviorSubject(convertToParamMap(initialId ? { id: initialId } : {}));

    TestBed.configureTestingModule({
      imports: [TutorDetailPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: TutorsService, useValue: tutorsServiceStub },
        { provide: BookingsService, useValue: bookingsServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? initialId : null) } },
            paramMap: paramMap$,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(TutorDetailPage);
    return { fixture, component: fixture.componentInstance, tutorsServiceStub, bookingsServiceStub, paramMap$ };
  }

  async function flushFoundTutor(
    tutorsServiceStub: { getById: ReturnType<typeof vi.fn> },
    bookingsServiceStub: { getSchedules: ReturnType<typeof vi.fn>; getRatings: ReturnType<typeof vi.fn> },
  ): Promise<void> {
    await tutorsServiceStub.getById.mock.results[0]!.value;
    await Promise.all([bookingsServiceStub.getSchedules.mock.results[0]!.value, bookingsServiceStub.getRatings.mock.results[0]!.value]);
  }

  it('perfil de tutor válido: muestra datos, stats, horarios y reseñas', async () => {
    const { fixture, component, tutorsServiceStub, bookingsServiceStub } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
      bookingsServiceStub: {
        getSchedules: vi.fn().mockResolvedValue([SCHEDULE]),
        getRatings: vi.fn().mockResolvedValue([RATING]),
      },
    });

    fixture.detectChanges();
    await flushFoundTutor(tutorsServiceStub, bookingsServiceStub);
    fixture.detectChanges();

    expect(component.tutor()).toBe(TUTOR);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Diego Fuentes');
    expect(fixture.nativeElement.textContent).toContain('42');
    expect(fixture.nativeElement.textContent).toContain('Cálculo II');
    expect(fixture.nativeElement.textContent).toContain('Martina Rojas');
  });

  it('tutor inexistente: muestra "Tutor no encontrado" sin EmptyStateComponent', async () => {
    const { fixture, component, tutorsServiceStub } = setup();

    fixture.detectChanges();
    await tutorsServiceStub.getById.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.tutor()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tutor no encontrado');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
  });

  it('sin id en la ruta: no llama a TutorsService y deja de cargar', async () => {
    const { fixture, component, tutorsServiceStub } = setup({ id: null });

    fixture.detectChanges();

    expect(tutorsServiceStub.getById).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('sin horario seleccionado: handleBooking() no llama a create()', async () => {
    const { component, bookingsServiceStub } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
    });

    await component.ngOnInit();
    expect(component.selectedSchedule()).toBeNull();

    await component.handleBooking();

    expect(bookingsServiceStub.create).not.toHaveBeenCalled();
  });

  it('reservar horario con éxito: crea la reserva, deselecciona el horario y muestra el toast de éxito', async () => {
    const { component, bookingsServiceStub } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
      bookingsServiceStub: { getSchedules: vi.fn().mockResolvedValue([SCHEDULE]) },
    });

    await component.ngOnInit();
    component.selectSchedule('s1');
    expect(component.selectedSchedule()).toBe('s1');

    await component.handleBooking();

    expect(bookingsServiceStub.create).toHaveBeenCalledWith('u1', TUTOR, 's1');
    expect(component.selectedSchedule()).toBeNull();
    expect(component.toastType()).toBe('success');
    expect(component.toastMessage()).toBe('¡Reserva creada! Revisa tus mensajes.');
    expect(component.booking()).toBe(false);
  });

  it('reservar horario con error: muestra el toast "Error al crear la reserva" y mantiene el horario seleccionado', async () => {
    const { component, bookingsServiceStub } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
      bookingsServiceStub: {
        getSchedules: vi.fn().mockResolvedValue([SCHEDULE]),
        create: vi.fn().mockResolvedValue({ error: 'Error al crear la reserva' }),
      },
    });

    await component.ngOnInit();
    component.selectSchedule('s1');

    await component.handleBooking();

    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('Error al crear la reserva');
    expect(component.selectedSchedule()).toBe('s1');
  });

  // Review fix: handleBooking() must not leave booking() stuck true with no
  // feedback if the selected schedule id somehow isn't in schedules()
  // anymore (defense-in-depth on top of the loadTutor() reset above).
  it('handleBooking(): si el horario seleccionado ya no está en schedules(), muestra error y no deja booking() colgado', async () => {
    const { component, bookingsServiceStub } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
      bookingsServiceStub: { getSchedules: vi.fn().mockResolvedValue([SCHEDULE]) },
    });

    await component.ngOnInit();
    component.selectedSchedule.set('no-existe');

    await component.handleBooking();

    expect(bookingsServiceStub.create).not.toHaveBeenCalled();
    expect(component.booking()).toBe(false);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('Error al crear la reserva');
  });

  it('selectSchedule() alterna la selección al hacer click dos veces sobre el mismo horario', async () => {
    const { component } = setup({
      tutorsServiceStub: { getById: vi.fn().mockResolvedValue(TUTOR) },
    });

    await component.ngOnInit();

    component.selectSchedule('s1');
    expect(component.selectedSchedule()).toBe('s1');

    component.selectSchedule('s1');
    expect(component.selectedSchedule()).toBeNull();
  });

  // Review fix pattern (note-detail.page.spec.ts): Angular reuses this
  // component instance across navigations that only change `:id`.
  it('cambia el id de la ruta (misma instancia reusada): refetchea el nuevo tutor', async () => {
    const otherTutor = { ...TUTOR, id: 't2', user: { ...TUTOR.user!, full_name: 'Otro Tutor' } };
    const getById = vi.fn().mockImplementation((id: string) => Promise.resolve(id === 't1' ? TUTOR : otherTutor));
    const { component, paramMap$ } = setup({ tutorsServiceStub: { getById } });

    await component.ngOnInit();
    expect(component.tutor()).toBe(TUTOR);
    expect(getById).toHaveBeenCalledTimes(1);

    paramMap$.next(convertToParamMap({ id: 't2' }));
    await getById.mock.results[1]!.value;

    expect(getById).toHaveBeenCalledTimes(2);
    expect(getById).toHaveBeenLastCalledWith('t2');
    expect(component.tutor()).toBe(otherTutor);
  });

  // Review fix: a schedule id selected for the previous tutor must not
  // survive a route `:id` change into the new tutor's page.
  it('cambia el id de la ruta: deselecciona el horario elegido para el tutor anterior', async () => {
    const otherTutor = { ...TUTOR, id: 't2' };
    const getById = vi.fn().mockImplementation((id: string) => Promise.resolve(id === 't1' ? TUTOR : otherTutor));
    const { component, paramMap$ } = setup({
      tutorsServiceStub: { getById },
      bookingsServiceStub: { getSchedules: vi.fn().mockResolvedValue([SCHEDULE]) },
    });

    await component.ngOnInit();
    component.selectSchedule('s1');
    expect(component.selectedSchedule()).toBe('s1');

    paramMap$.next(convertToParamMap({ id: 't2' }));
    await getById.mock.results[1]!.value;

    expect(component.selectedSchedule()).toBeNull();
  });

  // Review fix: loadTutor() must discard a stale response instead of
  // letting a slower earlier request overwrite the newer tutor already on
  // screen.
  it('resolución fuera de orden: una respuesta lenta del id anterior no sobrescribe al tutor más nuevo', async () => {
    // Microtask-only tick — deliberately not a `setTimeout`-based flush:
    // yielding to a real macrotask here lets TestBed's own scheduled initial
    // change detection sneak in a *second*, automatic `ngOnInit()` call
    // (re-subscribing to `paramMap$` and re-running `loadTutor` for both
    // ids), which would corrupt this test's call counts unrelated to the
    // fix under test.
    const tick = () => Promise.resolve();
    let resolveFirst!: (tutor: Tutor) => void;
    let resolveSecond!: (tutor: Tutor) => void;
    const firstPromise = new Promise<Tutor>((resolve) => (resolveFirst = resolve));
    const secondPromise = new Promise<Tutor>((resolve) => (resolveSecond = resolve));
    const getById = vi.fn().mockImplementationOnce(() => firstPromise).mockImplementationOnce(() => secondPromise);
    const { component, paramMap$ } = setup({ tutorsServiceStub: { getById } });

    const initPromise = component.ngOnInit();
    paramMap$.next(convertToParamMap({ id: 't2' }));
    expect(getById).toHaveBeenCalledTimes(2);

    const otherTutor = { ...TUTOR, id: 't2' };
    // The newer (t2) request resolves first...
    resolveSecond(otherTutor);
    await secondPromise;
    await tick();
    await tick();
    expect(component.tutor()).toBe(otherTutor);

    // ...and the stale (t1) request resolves after — it must be discarded.
    resolveFirst(TUTOR);
    await firstPromise;
    await tick();
    expect(component.tutor()).toBe(otherTutor);

    await initPromise;
  });
});
