import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { PublishTutorPage } from './publish-tutor.page';
import { AuthService } from '../shared/state/auth.service';
import { TutorsService } from '../shared/state/tutors.service';

// Covers the CAP-4 (resto, spec-cap-4-publish-tutor) I/O matrix rows: "Campos
// incompletos", "Submit ok", "Insert en tutors falla", "Agregar/quitar curso".
describe('PublishTutorPage', () => {
  function setup(tutorsOverrides: Record<string, unknown> = {}, userId: string | null = 'u1') {
    const authStub = { user: vi.fn().mockReturnValue(userId ? { id: userId } : null) };
    const tutorsServiceStub = {
      create: vi.fn().mockResolvedValue({ error: null }),
      ...tutorsOverrides,
    };

    TestBed.configureTestingModule({
      imports: [PublishTutorPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: TutorsService, useValue: tutorsServiceStub },
      ],
    });

    const fixture = TestBed.createComponent(PublishTutorPage);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance, tutorsServiceStub };
  }

  it('sin bio, sin modalidad y sin curso completo: canSubmit() es false', () => {
    const { component } = setup();

    expect(component.canSubmit()).toBe(false);
  });

  it('con bio pero sin modalidad: canSubmit() sigue false', () => {
    const { component } = setup();

    component.setBio('Ayudante de Cálculo');
    component.updateCourse(0, 'course_name', 'Cálculo II');
    component.updateCourse(0, 'major', 'Ingeniería Civil Informática');

    expect(component.canSubmit()).toBe(false);
  });

  it('con bio, modalidad y ningún curso completo: canSubmit() sigue false', () => {
    const { component } = setup();

    component.setBio('Ayudante de Cálculo');
    component.toggleModality('presencial');
    component.updateCourse(0, 'course_name', 'Cálculo II');
    // major queda vacío -> curso incompleto

    expect(component.canSubmit()).toBe(false);
  });

  it('con bio, modalidad y al menos un curso completo: canSubmit() es true', () => {
    const { component } = setup();

    component.setBio('Ayudante de Cálculo');
    component.toggleModality('presencial');
    component.updateCourse(0, 'course_name', 'Cálculo II');
    component.updateCourse(0, 'major', 'Ingeniería Civil Informática');

    expect(component.canSubmit()).toBe(true);
  });

  it('toggleModality() agrega y quita la modalidad', () => {
    const { component } = setup();

    component.toggleModality('online');
    expect(component.modalities()).toEqual(['online']);

    component.toggleModality('online');
    expect(component.modalities()).toEqual([]);
  });

  it('addCourse() agrega una fila y removeCourse() la quita', () => {
    const { component } = setup();

    component.addCourse();
    expect(component.courses().length).toBe(2);

    component.removeCourse(0);
    expect(component.courses().length).toBe(1);
  });

  it('valores por defecto: hourlyPrice 10000 y campus "Santiago"', () => {
    const { component } = setup();

    expect(component.hourlyPrice()).toBe(10000);
    expect(component.campus()).toBe('Santiago');
  });

  it('submit() con éxito: inserta y muestra el toast de éxito, sin redirect', async () => {
    const { component, tutorsServiceStub } = setup();

    component.setBio('Ayudante de Cálculo');
    component.experience.set('2 años dando clases particulares');
    component.setHourlyPrice(15000);
    component.setCampus('Vitacura');
    component.toggleModality('presencial');
    component.toggleModality('online');
    component.updateCourse(0, 'course_name', 'Cálculo II');
    component.updateCourse(0, 'major', 'Ingeniería Civil Informática');

    await component.submit();

    expect(tutorsServiceStub['create']).toHaveBeenCalledWith('u1', {
      bio: 'Ayudante de Cálculo',
      experience: '2 años dando clases particulares',
      hourly_price: 15000,
      campus: 'Vitacura',
      modalities: ['presencial', 'online'],
      courses: [{ course_name: 'Cálculo II', major: 'Ingeniería Civil Informática' }],
    });
    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('success');
    expect(component.toastMessage()).toBe('¡Perfil de tutor creado!');
    expect(component.loading()).toBe(false);
  });

  it('submit() con error en insert de tutors: muestra el toast de error genérico y loading vuelve a false', async () => {
    const { component } = setup({
      create: vi.fn().mockResolvedValue({ error: 'Error al crear perfil de tutor' }),
    });

    component.setBio('Ayudante de Cálculo');
    component.toggleModality('presencial');
    component.updateCourse(0, 'course_name', 'Cálculo II');
    component.updateCourse(0, 'major', 'Ingeniería Civil Informática');

    await component.submit();

    expect(component.toastOpen()).toBe(true);
    expect(component.toastType()).toBe('error');
    expect(component.toastMessage()).toBe('Error al crear perfil de tutor');
    expect(component.loading()).toBe(false);
  });

  it('submit() sin usuario: no llama a create()', async () => {
    const { component, tutorsServiceStub } = setup({}, null);

    await component.submit();

    expect(tutorsServiceStub['create']).not.toHaveBeenCalled();
  });
});
