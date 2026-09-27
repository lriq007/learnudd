import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { PublishNotePage } from './publish-note.page';
import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';

// Covers the CAP-3 spec-cap-3-publish-note I/O matrix rows: "Wizard paso
// incompleto", "Wizard submit ok", "Wizard submit error".
describe('PublishNotePage', () => {
  function setup(notesOverrides: Record<string, unknown> = {}, userId: string | null = 'u1') {
    const authStub = { user: vi.fn().mockReturnValue(userId ? { id: userId } : null) };
    const notesServiceStub = {
      create: vi.fn().mockResolvedValue({ error: null }),
      ...notesOverrides,
    };

    TestBed.configureTestingModule({
      imports: [PublishNotePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: NotesService, useValue: notesServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(PublishNotePage);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance, notesServiceStub };
  }

  it('paso 1 sin title/course: "Siguiente" queda deshabilitado y next() no avanza', () => {
    const { component } = setup();

    expect(component.step()).toBe(1);
    expect(component.canProceed()).toBe(false);

    component.next();

    expect(component.step()).toBe(1);
  });

  it('paso 1 con title y course: canProceed() es true y next() avanza al paso 2', () => {
    const { component } = setup();

    component.title.set('Resumen Cálculo II');
    component.course.set('Cálculo II');
    expect(component.canProceed()).toBe(true);

    component.next();

    expect(component.step()).toBe(2);
  });

  it('paso 2 sin major/materialType: canProceed() es false y next() no avanza', () => {
    const { component } = setup();

    component.title.set('Resumen Cálculo II');
    component.course.set('Cálculo II');
    component.next();
    expect(component.step()).toBe(2);
    expect(component.canProceed()).toBe(false);

    component.next();

    expect(component.step()).toBe(2);
  });

  it('paso 2 con major y materialType: canProceed() es true y next() avanza al paso 3', () => {
    const { component } = setup();

    component.title.set('Resumen Cálculo II');
    component.course.set('Cálculo II');
    component.next();
    component.setMajor('Ingeniería Civil Informática');
    component.selectMaterialType('resumen');
    expect(component.canProceed()).toBe(true);

    component.next();

    expect(component.step()).toBe(3);
  });

  it('avanza hasta el paso 4: progress() es 100 y stepLabel() es "Revisión"', () => {
    const { component } = setup();

    component.title.set('Resumen Cálculo II');
    component.course.set('Cálculo II');
    component.next();
    component.setMajor('Ingeniería Civil Informática');
    component.selectMaterialType('resumen');
    component.next();
    component.next();

    expect(component.step()).toBe(4);
    expect(component.progress()).toBe(100);
    expect(component.stepLabel()).toBe('Revisión');
  });

  it('back() retrocede un paso', () => {
    const { component } = setup();

    component.title.set('T');
    component.course.set('C');
    component.next();
    expect(component.step()).toBe(2);

    component.back();

    expect(component.step()).toBe(1);
  });

  it('submit() con éxito: llama a create() con status implícito de review y muestra el toast de éxito, sin redirect', async () => {
    const { component, notesServiceStub } = setup();

    component.title.set('Resumen Cálculo II');
    component.description.set('Contenido del apunte');
    component.course.set('Cálculo II');
    component.setMajor('Ingeniería Civil Informática');
    component.setSemester('1° Semestre');
    component.selectMaterialType('resumen');
    component.setPrice(2490);
    component.pagesInput.set('25');
    component.selectAiDeclaration('assisted');

    await component.submit();

    expect(notesServiceStub['create']).toHaveBeenCalledWith('u1', {
      title: 'Resumen Cálculo II',
      description: 'Contenido del apunte',
      major: 'Ingeniería Civil Informática',
      course: 'Cálculo II',
      semester: '1° Semestre',
      material_type: 'resumen',
      price: 2490,
      pages: 25,
      ai_declaration: 'assisted',
      ai_details: '',
    });
    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('success');
    expect(component.toastMessage()).toBe('¡Apunte enviado a revisión!');
    expect(component.loading()).toBe(false);
  });

  it('submit() con error de Supabase: muestra el toast de error genérico y loading vuelve a false', async () => {
    const { component } = setup({ create: vi.fn().mockResolvedValue({ error: 'Error al publicar' }) });

    await component.submit();

    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('Error al publicar');
    expect(component.loading()).toBe(false);
  });

  it('submit() sin usuario: no llama a create()', async () => {
    const { component, notesServiceStub } = setup({}, null);

    await component.submit();

    expect(notesServiceStub['create']).not.toHaveBeenCalled();
  });

  it('semester conserva el label completo de la opción, sin split (a diferencia de onboarding)', () => {
    const { component } = setup();

    component.setSemester('3° Semestre');

    expect(component.semester()).toBe('3° Semestre');
  });

  it('formatPrice(0) es "Gratis" y formatPrice(2490) usa formato CLP', () => {
    const { component } = setup();

    expect(component.formatPrice(0)).toBe('Gratis');
    expect(component.formatPrice(2490)).toContain('2.490');
  });
});
