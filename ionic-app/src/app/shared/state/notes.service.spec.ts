import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NotesService } from './notes.service';
import { SupabaseService } from './supabase.service';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown }) => T) => Promise<T>;
}

// Mirrors the fluent Supabase query builder just enough for NotesService's
// own chains to run and resolve via `await` (the real builder is
// thenable — awaiting it without a terminal `.then()`/`.select()` executes
// the request). Every chain method returns the same mock so call order
// doesn't matter, matching how the real client behaves.
function createQueryMock(result: { data: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return mock;
}

describe('NotesService', () => {
  function setup(client: unknown) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client } }],
    });
    return TestBed.inject(NotesService);
  }

  it('fetchHome() resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
    const service = setup(null);

    await expect(service.fetchHome()).resolves.toEqual([]);
  });

  it('fetchHome() pide notas activas, ordenadas desc y limitadas a 5 (paridad page.tsx líneas 25-31)', async () => {
    const notes = [{ id: 'n1' }];
    const query = createQueryMock({ data: notes });
    const from = vi.fn(() => query);
    const service = setup({ from });

    const result = await service.fetchHome();

    expect(from).toHaveBeenCalledWith('notes');
    expect(query.eq).toHaveBeenCalledWith('status', 'active');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(result).toBe(notes);
  });

  it('fetchHome() cae a [] cuando data es null (paridad: MVP hace `data || []`, sin manejo de error)', async () => {
    const query = createQueryMock({ data: null });
    const service = setup({ from: vi.fn(() => query) });

    await expect(service.fetchHome()).resolves.toEqual([]);
  });

  it('search() resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
    const service = setup(null);

    await expect(service.search({ query: '', major: '', materialType: '' })).resolves.toEqual([]);
  });

  it('search() solo aplica los filtros presentes (query/major/materialType)', async () => {
    const query = createQueryMock({ data: [] });
    const service = setup({ from: vi.fn(() => query) });

    await service.search({ query: 'calculo', major: 'Derecho', materialType: 'resumen' });

    expect(query.or).toHaveBeenCalledWith('title.ilike.%calculo%,course.ilike.%calculo%');
    expect(query.eq).toHaveBeenCalledWith('major', 'Derecho');
    expect(query.eq).toHaveBeenCalledWith('material_type', 'resumen');
  });

  it('search() no llama or()/major/materialType cuando esos filtros están vacíos', async () => {
    const query = createQueryMock({ data: [] });
    const service = setup({ from: vi.fn(() => query) });

    await service.search({ query: '', major: '', materialType: '' });

    expect(query.or).not.toHaveBeenCalled();
    // status=active sigue llamándose siempre; major/materialType no deben agregarse.
    expect(query.eq).toHaveBeenCalledWith('status', 'active');
    expect(query.eq).not.toHaveBeenCalledWith('major', expect.anything());
    expect(query.eq).not.toHaveBeenCalledWith('material_type', expect.anything());
  });
});
