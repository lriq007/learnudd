import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FavoritesService } from './favorites.service';
import { SupabaseService } from './supabase.service';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown }) => T) => Promise<T>;
}

function createQueryMock(result: { data: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    order: vi.fn(() => mock),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return mock;
}

describe('FavoritesService', () => {
  function setup(client: unknown) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client } }],
    });
    return TestBed.inject(FavoritesService);
  }

  it('fetchAll() resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
    const service = setup(null);

    await expect(service.fetchAll('u1')).resolves.toEqual([]);
  });

  it('fetchAll() filtra por user_id y ordena desc (paridad favorites/page.tsx líneas 26-30)', async () => {
    // I/O matrix: "Favorito con note o tutor nulo" — the raw rows can carry
    // only one of the two joins populated; fetchAll() passes them through
    // unmodified (the page decides which card to render, see
    // favorites.page.spec.ts).
    const favorites = [
      { id: 'f1', note: { id: 'n1' }, tutor: null },
      { id: 'f2', note: null, tutor: { id: 't1' } },
    ];
    const query = createQueryMock({ data: favorites });
    const from = vi.fn(() => query);
    const service = setup({ from });

    const result = await service.fetchAll('u1');

    expect(from).toHaveBeenCalledWith('favorites');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toBe(favorites);
  });

  it('fetchAll() cae a [] cuando data es null', async () => {
    const query = createQueryMock({ data: null });
    const service = setup({ from: vi.fn(() => query) });

    await expect(service.fetchAll('u1')).resolves.toEqual([]);
  });
});
