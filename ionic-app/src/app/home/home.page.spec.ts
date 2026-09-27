import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { HomePage } from './home.page';
import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import { TutorsService } from '../shared/state/tutors.service';

// Covers the CAP-2 spec's I/O matrix row: "Home sin notas/tutores", plus the
// Acceptance Criteria's "ve saludo, quick actions y las 3 secciones".
describe('HomePage', () => {
  function setup(overrides: {
    notesServiceStub?: { fetchHome: ReturnType<typeof vi.fn> };
    tutorsServiceStub?: { fetchHome: ReturnType<typeof vi.fn> };
  } = {}) {
    const authStub = { user: vi.fn().mockReturnValue({ id: 'u1', full_name: 'Martina Rojas' }) };
    const notesServiceStub = overrides.notesServiceStub ?? { fetchHome: vi.fn().mockResolvedValue([]) };
    const tutorsServiceStub = overrides.tutorsServiceStub ?? { fetchHome: vi.fn().mockResolvedValue([]) };

    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
        { provide: TutorsService, useValue: tutorsServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(HomePage);
    return { fixture, component: fixture.componentInstance, notesServiceStub, tutorsServiceStub };
  }

  it('con ambas queries en [], las 3 secciones quedan vacías sin mostrar ningún EmptyState (paridad: MVP no maneja este caso)', async () => {
    const { fixture, component, notesServiceStub, tutorsServiceStub } = setup();

    // fixture.detectChanges() triggers Angular's own (framework-invoked)
    // first call to ngOnInit() — calling ngOnInit() a second time manually
    // here would double-fetch, so instead we await the very promise the
    // service mocks returned during that first detectChanges() pass.
    fixture.detectChanges();
    await notesServiceStub.fetchHome.mock.results[0]!.value;
    await tutorsServiceStub.fetchHome.mock.results[0]!.value;
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.notes()).toEqual([]);
    expect(component.tutors()).toEqual([]);
    expect(component.courseNotes()).toEqual([]);
    expect(component.topRatedNotes()).toEqual([]);

    expect(fixture.nativeElement.querySelectorAll('app-empty-state').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-note-card').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-tutor-card').length).toBe(0);
  });

  it('con notas/tutores no vacíos, renderiza el saludo y los 2 links de quick actions', async () => {
    const notesServiceStub = {
      fetchHome: vi.fn().mockResolvedValue([
        {
          id: 'n1',
          title: 'Resumen de Cálculo II',
          course: 'Cálculo II',
          price: 0,
          average_rating: 4.8,
          ratings_count: 10,
          author: { full_name: 'Ana' },
        },
      ]),
    };
    const tutorsServiceStub = {
      fetchHome: vi.fn().mockResolvedValue([
        {
          id: 't1',
          verified: true,
          hourly_price: 12000,
          average_rating: 4.9,
          ratings_count: 5,
          user: { full_name: 'Tomás', major: 'Derecho' },
          courses: [{ course_name: 'Álgebra Lineal' }],
        },
      ]),
    };
    const { fixture, component, notesServiceStub: notes, tutorsServiceStub: tutors } = setup({
      notesServiceStub,
      tutorsServiceStub,
    });

    fixture.detectChanges();
    await notes.fetchHome.mock.results[0]!.value;
    await tutors.fetchHome.mock.results[0]!.value;
    fixture.detectChanges();

    // Greeting: "{greeting()}, {firstName()}" (Acceptance Criteria: "ve saludo").
    expect(fixture.nativeElement.textContent).toContain(`${component.greeting()}, ${component.firstName()}`);

    // Quick actions: both links to /explore, one per tab (Acceptance
    // Criteria: "ve ... quick actions").
    const quickActionLinks: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll(
      'a.home-quick-actions__item',
    );
    expect(quickActionLinks.length).toBe(2);
    expect(quickActionLinks[0]!.getAttribute('href')).toBe('/explore?tab=notes');
    expect(quickActionLinks[1]!.getAttribute('href')).toBe('/explore?tab=tutors');

    // The 3 sections actually render content when the data isn't empty.
    expect(fixture.nativeElement.querySelectorAll('app-note-card').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('app-tutor-card').length).toBeGreaterThan(0);
  });
});
