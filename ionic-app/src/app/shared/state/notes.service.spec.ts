import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NotesService } from './notes.service';
import { SupabaseService } from './supabase.service';
import type { Note } from '../models';

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  then: <T>(onFulfilled: (value: { data: unknown; error?: unknown }) => T) => Promise<T>;
}

// Mirrors the fluent Supabase query builder just enough for NotesService's
// own chains to run and resolve via `await` (the real builder is
// thenable — awaiting it without a terminal `.then()`/`.select()` executes
// the request). Every chain method returns the same mock so call order
// doesn't matter, matching how the real client behaves.
function createQueryMock(result: { data: unknown; error?: unknown }): QueryMock {
  const mock: QueryMock = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => mock),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
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

  // CAP-3: I/O matrix "Detalle de apunte válido" / "Apunte inexistente".
  describe('getById()', () => {
    it('resuelve null cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.getById('n1')).resolves.toBeNull();
    });

    it('pide la nota por id con su autor (paridad page.tsx líneas 38-46)', async () => {
      const note = { id: 'n1' };
      const query = createQueryMock({ data: note });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.getById('n1');

      expect(from).toHaveBeenCalledWith('notes');
      expect(query.select).toHaveBeenCalledWith('*, author:profiles(*)');
      expect(query.eq).toHaveBeenCalledWith('id', 'n1');
      expect(query.single).toHaveBeenCalled();
      expect(result).toBe(note);
    });

    it('resuelve null cuando no hay match (paridad: `.single()` sin fila → data null/undefined)', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.getById('missing')).resolves.toBeNull();
    });
  });

  describe('getRatings()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.getRatings('n1')).resolves.toEqual([]);
    });

    it('pide las reseñas del apunte con su autor, ordenadas desc (paridad page.tsx líneas 48-54)', async () => {
      const ratings = [{ id: 'r1' }];
      const query = createQueryMock({ data: ratings });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.getRatings('n1');

      expect(from).toHaveBeenCalledWith('note_ratings');
      expect(query.select).toHaveBeenCalledWith('*, user:profiles(*)');
      expect(query.eq).toHaveBeenCalledWith('note_id', 'n1');
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(ratings);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.getRatings('n1')).resolves.toEqual([]);
    });
  });

  // CAP-3: I/O matrix "Biblioteca con compras".
  describe('listPurchased()', () => {
    it('resuelve [] cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.listPurchased('u1')).resolves.toEqual([]);
    });

    it('pide la biblioteca del usuario con la nota y su autor, ordenada por purchased_at desc (paridad library/page.tsx líneas 26-39)', async () => {
      const items = [{ id: 'l1' }];
      const query = createQueryMock({ data: items });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.listPurchased('u1');

      expect(from).toHaveBeenCalledWith('library');
      expect(query.select).toHaveBeenCalledWith('*, note:notes(*, author:profiles(*))');
      expect(query.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(query.order).toHaveBeenCalledWith('purchased_at', { ascending: false });
      expect(result).toBe(items);
    });

    it('cae a [] cuando data es null', async () => {
      const query = createQueryMock({ data: null });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.listPurchased('u1')).resolves.toEqual([]);
    });
  });

  // CAP-3: I/O matrix "Comprar / descargar gratis".
  describe('purchase()', () => {
    const note = { id: 'n1', downloads: 4 } as Note;

    it('devuelve error cuando Supabase no está configurado, sin simular el delay de pago', async () => {
      const service = setup(null);

      const result = await service.purchase('u1', note);

      expect(result).toEqual({ error: 'Error al procesar el pago' });
    });

    it('simula el pago (delay de 1500ms), inserta en library y actualiza downloads (paridad handlePurchase líneas 73-100)', async () => {
      vi.useFakeTimers();
      try {
        const libraryQuery = createQueryMock({ data: null, error: null });
        const notesQuery = createQueryMock({ data: null, error: null });
        const from = vi.fn((table: string) => (table === 'library' ? libraryQuery : notesQuery));
        const service = setup({ from });

        const promise = service.purchase('u1', note);
        await vi.advanceTimersByTimeAsync(1500);
        const result = await promise;

        expect(result).toEqual({ error: null });
        expect(from).toHaveBeenCalledWith('library');
        expect(libraryQuery.insert).toHaveBeenCalledWith({ user_id: 'u1', note_id: 'n1' });
        expect(from).toHaveBeenCalledWith('notes');
        expect(notesQuery.update).toHaveBeenCalledWith({ downloads: 5 });
        expect(notesQuery.eq).toHaveBeenCalledWith('id', 'n1');
      } finally {
        vi.useRealTimers();
      }
    });

    it('cuando el insert falla, devuelve el error de pago y no actualiza downloads', async () => {
      vi.useFakeTimers();
      try {
        const libraryQuery = createQueryMock({ data: null, error: { message: 'insert failed' } });
        const notesQuery = createQueryMock({ data: null, error: null });
        const from = vi.fn((table: string) => (table === 'library' ? libraryQuery : notesQuery));
        const service = setup({ from });

        const promise = service.purchase('u1', note);
        await vi.advanceTimersByTimeAsync(1500);
        const result = await promise;

        expect(result).toEqual({ error: 'Error al procesar el pago' });
        expect(notesQuery.update).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // CAP-3 spec-cap-3-publish-note: I/O matrix "Wizard submit ok" / "Wizard
  // submit error".
  describe('create()', () => {
    const input = {
      title: 'Resumen Cálculo II',
      description: '',
      major: 'Ingeniería Civil Informática',
      course: 'Cálculo II',
      semester: '',
      material_type: 'resumen',
      price: 2490,
      pages: 0,
      ai_declaration: 'none' as const,
      ai_details: '',
    };

    it('devuelve el error genérico cuando Supabase no está configurado (cliente null)', async () => {
      const service = setup(null);

      await expect(service.create('u1', input)).resolves.toEqual({ error: 'Error al publicar' });
    });

    it('inserta la nota con status "review", mapeando campos 1:1 (paridad handleSubmit líneas 59-72)', async () => {
      const query = createQueryMock({ data: null, error: null });
      const from = vi.fn(() => query);
      const service = setup({ from });

      const result = await service.create('u1', input);

      expect(from).toHaveBeenCalledWith('notes');
      expect(query.insert).toHaveBeenCalledWith({
        author_id: 'u1',
        title: 'Resumen Cálculo II',
        description: null,
        major: 'Ingeniería Civil Informática',
        course: 'Cálculo II',
        semester: null,
        material_type: 'resumen',
        price: 2490,
        pages: null,
        ai_declaration: 'none',
        ai_details: null,
        status: 'review',
      });
      expect(result).toEqual({ error: null });
    });

    it('cuando el insert de Supabase falla, devuelve el mismo error genérico "Error al publicar"', async () => {
      const query = createQueryMock({ data: null, error: { message: 'insert failed' } });
      const service = setup({ from: vi.fn(() => query) });

      await expect(service.create('u1', input)).resolves.toEqual({ error: 'Error al publicar' });
    });

    it('con price 0 (apunte gratis), inserta price: 0 tal cual, no null (a diferencia de pages)', async () => {
      const query = createQueryMock({ data: null, error: null });
      const service = setup({ from: vi.fn(() => query) });

      await service.create('u1', { ...input, price: 0 });

      expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ price: 0 }));
    });
  });
});
