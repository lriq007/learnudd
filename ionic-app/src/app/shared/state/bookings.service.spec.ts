import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BookingsService } from './bookings.service';
import { SupabaseService } from './supabase.service';
import type { Tutor } from '../models';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown; error?: unknown }) => T) => Promise<T>;
}

function createQueryMock(result: { data: unknown; error?: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return mock;
}

const TUTOR: Tutor = {
  id: 't1',
  user_id: 'u-tutor',
  bio: null,
  experience: null,
  hourly_price: 15000,
  campus: 'Santiago',
  modalities: ['online', 'presencial'],
  verified: true,
  total_classes: 5,
  created_at: '2026-01-01',
  courses: [{ id: 'c1', tutor_id: 't1', course_name: 'Cálculo II', major: 'Ingeniería Civil Informática' }],
};

describe('BookingsService', () => {
  function setup(client: unknown) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client } }],
    });
    return TestBed.inject(BookingsService);
  }

  // CAP-4: I/O matrix "Perfil de tutor válido" (horarios disponibles).
  describe('getSchedules()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.getSchedules('t1')).resolves.toEqual([]);
    });

    it('pide horarios disponibles desde hoy, ordenados asc y limitados a 10 (paridad tutors/[id]/page.tsx líneas 54-62)', async () => {
      const schedules = [{ id: 's1' }];
      const query = createQueryMock({ data: schedules });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.getSchedules('t1');

      expect(from).toHaveBeenCalledWith('tutor_schedules');
      expect(query.eq).toHaveBeenCalledWith('tutor_id', 't1');
      expect(query.eq).toHaveBeenCalledWith('available', true);
      expect(query.gte).toHaveBeenCalledWith('date', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
      expect(query.order).toHaveBeenCalledWith('date', { ascending: true });
      expect(query.limit).toHaveBeenCalledWith(10);
      expect(result).toBe(schedules);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.getSchedules('t1')).resolves.toEqual([]);
    });
  });

  // CAP-4: I/O matrix "Perfil de tutor válido" (reseñas).
  describe('getRatings()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.getRatings('t1')).resolves.toEqual([]);
    });

    it('pide reseñas del tutor ordenadas desc (paridad tutors/[id]/page.tsx líneas 63-67)', async () => {
      const ratings = [{ id: 'r1' }];
      const query = createQueryMock({ data: ratings });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.getRatings('t1');

      expect(from).toHaveBeenCalledWith('tutor_ratings');
      expect(query.eq).toHaveBeenCalledWith('tutor_id', 't1');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(ratings);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.getRatings('t1')).resolves.toEqual([]);
    });
  });

  // CAP-4: I/O matrix "Reservar horario".
  describe('create()', () => {
    it('devuelve error cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.create('u1', TUTOR, 's1')).resolves.toEqual({ error: 'Error al crear la reserva' });
    });

    it('inserta la reserva y marca el horario no disponible (paridad handleBooking líneas 87-105)', async () => {
      const bookingsQuery = createQueryMock({ data: null, error: null });
      const schedulesQuery = createQueryMock({ data: null, error: null });
      const from = vi.fn((table: string) => (table === 'bookings' ? bookingsQuery : schedulesQuery));
      const service = setup({ from });

      const result = await service.create('u1', TUTOR, 's1');

      expect(from).toHaveBeenCalledWith('bookings');
      expect(bookingsQuery.insert).toHaveBeenCalledWith({
        student_id: 'u1',
        tutor_id: 't1',
        schedule_id: 's1',
        course: 'Cálculo II',
        modality: 'online',
        status: 'pending',
        payment_status: 'pending',
        payment_amount: 15000,
      });
      expect(from).toHaveBeenCalledWith('tutor_schedules');
      expect(schedulesQuery.update).toHaveBeenCalledWith({ available: false });
      expect(schedulesQuery.eq).toHaveBeenCalledWith('id', 's1');
      expect(result).toEqual({ error: null });
    });

    it('usa modality "presencial" cuando el tutor no ofrece online', async () => {
      const presencialTutor: Tutor = { ...TUTOR, modalities: ['presencial'] };
      const bookingsQuery = createQueryMock({ data: null, error: null });
      const schedulesQuery = createQueryMock({ data: null, error: null });
      const from = vi.fn((table: string) => (table === 'bookings' ? bookingsQuery : schedulesQuery));
      const service = setup({ from });

      await service.create('u1', presencialTutor, 's1');

      expect(bookingsQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ modality: 'presencial' }));
    });

    it('usa "General" como course cuando el tutor no tiene cursos', async () => {
      const noCoursesTutor: Tutor = { ...TUTOR, courses: [] };
      const bookingsQuery = createQueryMock({ data: null, error: null });
      const schedulesQuery = createQueryMock({ data: null, error: null });
      const from = vi.fn((table: string) => (table === 'bookings' ? bookingsQuery : schedulesQuery));
      const service = setup({ from });

      await service.create('u1', noCoursesTutor, 's1');

      expect(bookingsQuery.insert).toHaveBeenCalledWith(expect.objectContaining({ course: 'General' }));
    });

    it('cuando el insert falla, no actualiza tutor_schedules y devuelve el error genérico', async () => {
      const bookingsQuery = createQueryMock({ data: null, error: { message: 'boom' } });
      const schedulesQuery = createQueryMock({ data: null, error: null });
      const from = vi.fn((table: string) => (table === 'bookings' ? bookingsQuery : schedulesQuery));
      const service = setup({ from });

      const result = await service.create('u1', TUTOR, 's1');

      expect(result).toEqual({ error: 'Error al crear la reserva' });
      expect(schedulesQuery.update).not.toHaveBeenCalled();
    });
  });

  // CAP-4: I/O matrix "Reservas del estudiante".
  describe('listForStudent()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.listForStudent('u1')).resolves.toEqual([]);
    });

    it('pide las reservas del estudiante con sus joins, ordenadas desc (paridad bookings/page.tsx líneas 32-38)', async () => {
      const bookings = [{ id: 'b1' }];
      const query = createQueryMock({ data: bookings });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.listForStudent('u1');

      expect(from).toHaveBeenCalledWith('bookings');
      expect(query.select).toHaveBeenCalledWith('*, tutor:tutors(*, user:profiles(*)), schedule:tutor_schedules(*)');
      expect(query.eq).toHaveBeenCalledWith('student_id', 'u1');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(bookings);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.listForStudent('u1')).resolves.toEqual([]);
    });
  });
});
