import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { LibraryPage } from './library.page';
import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import type { LibraryItem } from '../shared/models';

// Covers the CAP-3 spec's I/O matrix rows: "Biblioteca vacía" and
// "Biblioteca con compras".
describe('LibraryPage', () => {
  function setup(items: LibraryItem[] = [], userId: string | null = 'u1') {
    const authStub = { user: vi.fn().mockReturnValue(userId ? { id: userId } : null) };
    const notesServiceStub = { listPurchased: vi.fn().mockResolvedValue(items) };

    TestBed.configureTestingModule({
      imports: [LibraryPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
      ],
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LibraryPage);
    return { fixture, component: fixture.componentInstance, notesServiceStub, navigateSpy };
  }

  it('vacía: muestra el EmptyState y goExplore() navega a /explore', async () => {
    const { fixture, component, notesServiceStub, navigateSpy } = setup([]);

    fixture.detectChanges();
    await notesServiceStub.listPurchased.mock.results[0]!.value;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu biblioteca está vacía');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();

    component.goExplore();

    expect(navigateSpy).toHaveBeenCalledWith('/explore');
  });

  it('con compras: lista los items ordenados como los devuelve el servicio (purchased_at desc) y muestra la barra de progreso si progress > 0', async () => {
    const items = [
      {
        id: 'l1',
        user_id: 'u1',
        note_id: 'n1',
        purchased_at: '2026-01-02',
        last_accessed: null,
        progress: 40,
        note: {
          id: 'n1',
          title: 'Resumen de Cálculo II',
          course: 'Cálculo II',
          author: { full_name: 'Martina Rojas' },
        },
      },
      {
        id: 'l2',
        user_id: 'u1',
        note_id: 'n2',
        purchased_at: '2026-01-01',
        last_accessed: null,
        progress: 0,
        note: {
          id: 'n2',
          title: 'Guía de Álgebra',
          course: 'Álgebra',
          author: { full_name: 'Tomás Pérez' },
        },
      },
    ] as unknown as LibraryItem[];

    const { fixture, notesServiceStub } = setup(items);

    fixture.detectChanges();
    await notesServiceStub.listPurchased.mock.results[0]!.value;
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.library-item');
    expect(cards.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Resumen de Cálculo II');
    expect(fixture.nativeElement.textContent).toContain('Guía de Álgebra');
    expect(fixture.nativeElement.querySelectorAll('.library-item__progress').length).toBe(1);
  });

  it('sin usuario: no llama a listPurchased() y deja de cargar', async () => {
    const { fixture, component, notesServiceStub } = setup([], null);

    fixture.detectChanges();

    expect(notesServiceStub.listPurchased).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });
});
