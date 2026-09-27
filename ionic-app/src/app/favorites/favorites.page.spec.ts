import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { FavoritesPage } from './favorites.page';
import { AuthService } from '../shared/state/auth.service';
import { FavoritesService } from '../shared/state/favorites.service';
import type { Favorite } from '../shared/models';

// Covers the CAP-2 spec's I/O matrix rows: "Favoritos vacío" and "Favorito
// con note o tutor nulo".
describe('FavoritesPage', () => {
  function setup(favorites: Favorite[] = []) {
    const authStub = { user: vi.fn().mockReturnValue({ id: 'u1' }) };
    const favoritesServiceStub = { fetchAll: vi.fn().mockResolvedValue(favorites) };

    TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: FavoritesService, useValue: favoritesServiceStub },
      ],
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(FavoritesPage);
    return { fixture, component: fixture.componentInstance, favoritesServiceStub, navigateSpy };
  }

  it('vacío: muestra el EmptyState y goExplore() navega a /explore', async () => {
    const { fixture, component, favoritesServiceStub, navigateSpy } = setup([]);

    // fixture.detectChanges() triggers ngOnInit() (framework-invoked).
    fixture.detectChanges();
    await favoritesServiceStub.fetchAll.mock.results[0]!.value;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes favoritos');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();

    component.goExplore();

    expect(navigateSpy).toHaveBeenCalledWith('/explore');
  });

  it('favorito con solo note o solo tutor: renderiza NoteCard o TutorCard, nunca ambos', async () => {
    const favorites = [
      {
        id: 'f1',
        user_id: 'u1',
        note_id: 'n1',
        tutor_id: null,
        created_at: '2026-01-01',
        note: {
          id: 'n1',
          author_id: 'a1',
          title: 'Resumen de Cálculo II',
          description: null,
          major: 'Ingeniería Civil Informática',
          course: 'Cálculo II',
          semester: '1',
          material_type: 'resumen',
          price: 0,
          currency: 'CLP',
          pages: null,
          file_url: null,
          cover_url: null,
          ai_declaration: 'none',
          ai_details: null,
          status: 'active',
          downloads: 0,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
          author: null,
        },
        tutor: null,
      },
      {
        id: 'f2',
        user_id: 'u1',
        note_id: null,
        tutor_id: 't1',
        created_at: '2026-01-02',
        note: null,
        tutor: {
          id: 't1',
          user_id: 'u2',
          bio: null,
          experience: null,
          hourly_price: 10000,
          campus: 'Santiago',
          modalities: ['online'],
          verified: false,
          total_classes: 0,
          created_at: '2026-01-01',
          user: { full_name: 'Tomás', major: 'Derecho' },
          courses: [],
        },
      },
    ] as unknown as Favorite[];

    const { fixture, favoritesServiceStub } = setup(favorites);

    fixture.detectChanges();
    await favoritesServiceStub.fetchAll.mock.results[0]!.value;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-note-card').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('app-tutor-card').length).toBe(1);
  });
});
