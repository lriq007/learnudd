import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { BookingsPage } from './bookings.page';
import { AuthService } from '../shared/state/auth.service';
import { BookingsService } from '../shared/state/bookings.service';
import type { Booking } from '../shared/models';

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: 'b1',
    student_id: 'u1',
    tutor_id: 't1',
    schedule_id: 's1',
    course: 'Cálculo II',
    modality: 'online',
    status: 'pending',
    payment_status: 'pending',
    payment_amount: 15000,
    notes: null,
    meeting_link: null,
    location: null,
    created_at: '2026-01-01',
    tutor: {
      id: 't1',
      user_id: 'u-tutor',
      bio: null,
      experience: null,
      hourly_price: 15000,
      campus: 'Santiago',
      modalities: ['online'],
      verified: true,
      total_classes: 5,
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
    },
    schedule: {
      id: 's1',
      tutor_id: 't1',
      date: '2099-01-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
      available: false,
      recurring: false,
      created_at: '2026-01-01',
    },
    ...overrides,
  };
}

// Covers the CAP-4 spec's I/O matrix rows: "Reservas del estudiante" and
// "Reservas vacías en una tab".
describe('BookingsPage', () => {
  function setup(overrides: {
    userId?: string | null;
    bookingsServiceStub?: Partial<Record<'listForStudent', ReturnType<typeof vi.fn>>>;
  } = {}) {
    const bookingsServiceStub = {
      listForStudent: vi.fn().mockResolvedValue([]),
      ...overrides.bookingsServiceStub,
    };
    const authStub = {
      user: vi.fn().mockReturnValue(overrides.userId === null ? null : { id: overrides.userId ?? 'u1' }),
    };

    TestBed.configureTestingModule({
      imports: [BookingsPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: BookingsService, useValue: bookingsServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(BookingsPage);
    return { fixture, component: fixture.componentInstance, bookingsServiceStub, router: TestBed.inject(Router) };
  }

  it('sin sesión: no llama a BookingsService y deja de cargar', async () => {
    const { fixture, component, bookingsServiceStub } = setup({ userId: null });

    fixture.detectChanges();
    await Promise.resolve();

    expect(bookingsServiceStub.listForStudent).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('reservas próximas: una reserva pendiente con horario futuro cae en la tab "Próximas"', async () => {
    const upcomingBooking = makeBooking({ id: 'b1', status: 'pending' });
    const { fixture, component, bookingsServiceStub } = setup({
      bookingsServiceStub: { listForStudent: vi.fn().mockResolvedValue([upcomingBooking]) },
    });

    fixture.detectChanges();
    await bookingsServiceStub.listForStudent.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.upcoming()).toEqual([upcomingBooking]);
    expect(component.past()).toEqual([]);
    expect(component.filtered()).toEqual([upcomingBooking]);
    expect(fixture.nativeElement.textContent).toContain('Diego Fuentes');
    expect(fixture.nativeElement.textContent).toContain('Cálculo II');
  });

  it('reservas anteriores: una reserva completada cae en la tab "Anteriores"', async () => {
    const pastBooking = makeBooking({ id: 'b2', status: 'completed' });
    const { fixture, component, bookingsServiceStub } = setup({
      bookingsServiceStub: { listForStudent: vi.fn().mockResolvedValue([pastBooking]) },
    });

    fixture.detectChanges();
    await bookingsServiceStub.listForStudent.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.past()).toEqual([pastBooking]);
    expect(component.upcoming()).toEqual([]);

    component.setTab('past');
    fixture.detectChanges();

    expect(component.filtered()).toEqual([pastBooking]);
  });

  it('reservas anteriores: un horario ya pasado cae en "Anteriores" aunque el status siga pending', async () => {
    const pastSchedule = makeBooking({
      id: 'b3',
      status: 'pending',
      schedule: {
        id: 's3',
        tutor_id: 't1',
        date: '2000-01-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        available: false,
        recurring: false,
        created_at: '2026-01-01',
      },
    });
    const { component, bookingsServiceStub } = setup({
      bookingsServiceStub: { listForStudent: vi.fn().mockResolvedValue([pastSchedule]) },
    });

    await component.ngOnInit();

    expect(component.past()).toEqual([pastSchedule]);
    expect(component.upcoming()).toEqual([]);
  });

  it('tab vacía: muestra EmptyStateComponent con CTA a /explore', async () => {
    const { fixture, component, router } = setup({
      bookingsServiceStub: { listForStudent: vi.fn().mockResolvedValue([]) },
    });
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No tienes reservas próximas');

    component.goExplore();

    expect(navigateSpy).toHaveBeenCalledWith('/explore?tab=tutors');
  });

  it('badgeVariant() mapea cada status al variant de badge esperado', async () => {
    const { component } = setup();

    expect(component.badgeVariant('confirmed')).toBe('success');
    expect(component.badgeVariant('completed')).toBe('primary');
    expect(component.badgeVariant('cancelled')).toBe('default');
    expect(component.badgeVariant('pending')).toBe('warning');
  });

  it('goToChat() navega a /messages/:userId cuando el tutor tiene user_id', async () => {
    const { component, router } = setup();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.goToChat('u-tutor');

    expect(navigateSpy).toHaveBeenCalledWith('/messages/u-tutor');
  });

  it('goToChat() no navega cuando no hay user_id', async () => {
    const { component, router } = setup();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.goToChat(undefined);

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
