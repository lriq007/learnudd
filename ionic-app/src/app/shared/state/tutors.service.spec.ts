import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TutorsService } from './tutors.service';
import { SupabaseService } from './supabase.service';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown }) => T) => Promise<T>;
}

function createQueryMock(result: { data: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    contains: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => mock),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return mock;
}

describe('TutorsService', () => {
  function setup(client: unknown) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client } }],
    });
    return TestBed.inject(TutorsService);
  }

  it('fetchHome() resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
    const service = setup(null);

    await expect(service.fetchHome()).resolves.toEqual([]);
  });

  it('fetchHome() pide tutores verificados limitados a 3 (paridad page.tsx líneas 32-36)', async () => {
    const tutors = [{ id: 't1' }];
    const query = createQueryMock({ data: tutors });
    const from = vi.fn(() => query);
    const service = setup({ from });

    const result = await service.fetchHome();

    expect(from).toHaveBeenCalledWith('tutors');
    expect(query.eq).toHaveBeenCalledWith('verified', true);
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(result).toBe(tutors);
  });

  it('fetchHome() cae a [] cuando data es null', async () => {
    const query = createQueryMock({ data: null });
    const service = setup({ from: vi.fn(() => query) });

    await expect(service.fetchHome()).resolves.toEqual([]);
  });

  it('search() aplica el filtro anidado de major vía contains(courses.major) tal cual el MVP (líneas 64-85)', async () => {
    const query = createQueryMock({ data: [] });
    const service = setup({ from: vi.fn(() => query) });

    await service.search({ query: 'martina', major: 'Derecho' });

    expect(query.or).toHaveBeenCalledWith('user.full_name.ilike.%martina%,courses.course_name.ilike.%martina%');
    expect(query.contains).toHaveBeenCalledWith('courses.major', ['Derecho']);
  });

  it('search() no llama or()/contains() cuando query/major están vacíos', async () => {
    const query = createQueryMock({ data: [] });
    const service = setup({ from: vi.fn(() => query) });

    await service.search({ query: '', major: '' });

    expect(query.or).not.toHaveBeenCalled();
    expect(query.contains).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('verified', true);
  });

  // CAP-4: I/O matrix "Perfil de tutor válido" / "Tutor inexistente".
  describe('getById()', () => {
    it('resuelve null cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.getById('t1')).resolves.toBeNull();
    });

    it('pide el tutor por id con sus joins (paridad tutors/[id]/page.tsx líneas 44-51)', async () => {
      const tutor = { id: 't1' };
      const query = createQueryMock({ data: tutor });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.getById('t1');

      expect(from).toHaveBeenCalledWith('tutors');
      expect(query.select).toHaveBeenCalledWith('*, user:profiles(*), courses:tutor_courses(*)');
      expect(query.eq).toHaveBeenCalledWith('id', 't1');
      expect(query.single).toHaveBeenCalled();
      expect(result).toBe(tutor);
    });

    it('resuelve null cuando no hay match (`.single()` sin fila → data null/undefined)', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.getById('sin-match')).resolves.toBeNull();
    });
  });
});
