import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ExplorePage } from './explore.page';
import { NotesService } from '../shared/state/notes.service';
import { TutorsService } from '../shared/state/tutors.service';

type FetchableComponent = { fetch(): Promise<void> };

// Covers the CAP-2 spec's I/O matrix rows: "Explore cambia de tab o filtro
// mientras carga" and "Explore sin resultados".
describe('ExplorePage', () => {
  function setup(overrides: {
    notesServiceStub?: { search: ReturnType<typeof vi.fn> };
    tutorsServiceStub?: { search: ReturnType<typeof vi.fn> };
    initialTab?: string | null;
  } = {}) {
    const notesServiceStub = overrides.notesServiceStub ?? { search: vi.fn().mockResolvedValue([]) };
    const tutorsServiceStub = overrides.tutorsServiceStub ?? { search: vi.fn().mockResolvedValue([]) };

    TestBed.configureTestingModule({
      imports: [ExplorePage],
      providers: [
        provideRouter([]),
        { provide: NotesService, useValue: notesServiceStub },
        { provide: TutorsService, useValue: tutorsServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (key: string) => (key === 'tab' ? overrides.initialTab ?? null : null) },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ExplorePage);
    return { fixture, component: fixture.componentInstance, notesServiceStub, tutorsServiceStub };
  }

  it('con ?tab=tutors, el tab "Clases" queda activo y no se re-fetchea notas', async () => {
    const { fixture, component, notesServiceStub, tutorsServiceStub } = setup({ initialTab: 'tutors' });

    // fixture.detectChanges() triggers ngOnInit() (framework-invoked) which
    // calls fetch() once for the initial tab only.
    fixture.detectChanges();
    await tutorsServiceStub.search.mock.results[0]!.value;

    expect(component.activeTab()).toBe('tutors');
    expect(tutorsServiceStub.search).toHaveBeenCalledTimes(1);
    expect(notesServiceStub.search).not.toHaveBeenCalled();
  });

  it('descarta el resultado de un fetch obsoleto cuando un filtro cambia antes de que resuelva', async () => {
    const resolvers: Array<(value: unknown) => void> = [];
    const notesServiceStub = {
      search: vi.fn().mockImplementation(() => new Promise((resolve) => resolvers.push(resolve))),
    };
    const { component } = setup({ notesServiceStub });

    // Two overlapping fetches for the 'notes' tab (default), never through
    // Angular's own lifecycle — this test only needs signal state, not a
    // render, so it calls the private fetch() directly (cast around the
    // TS access modifier) to control resolution order deterministically.
    const fetchable = component as unknown as FetchableComponent;
    const fetch1 = fetchable.fetch();
    component.major.set('Derecho');
    const fetch2 = fetchable.fetch();

    // Resolve the newer request first, then the stale one.
    resolvers[1]!([{ id: 'n2' }]);
    await fetch2;
    resolvers[0]!([{ id: 'n1' }]);
    await fetch1;

    expect(component.notes()).toEqual([{ id: 'n2' }]);
  });

  it('sin resultados de apuntes, muestra el EmptyState con el texto de apuntes', async () => {
    const { fixture, component, notesServiceStub } = setup();

    fixture.detectChanges();
    await notesServiceStub.search.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.notes()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No se encontraron apuntes');
  });

  it('sin resultados de tutores, muestra el EmptyState con el texto de tutores', async () => {
    const { fixture, component, tutorsServiceStub } = setup();
    component.activeTab.set('tutors');

    fixture.detectChanges();
    await tutorsServiceStub.search.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.tutors()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No se encontraron tutores');
  });
});
