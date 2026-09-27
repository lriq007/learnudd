import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { OnboardingPage } from './onboarding.page';
import { AuthService } from '../shared/state/auth.service';

// Covers the CAP-1 spec's I/O matrix row: "Onboarding paso incompleto", plus
// submit()'s success and failure paths.
describe('OnboardingPage', () => {
  function setup(authOverrides: Record<string, unknown> = {}) {
    const authServiceStub = {
      user: vi.fn().mockReturnValue({ id: 'user-1', onboarding_completed: false }),
      updateProfile: vi.fn().mockResolvedValue({ error: null }),
      ...authOverrides,
    };

    TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }],
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(OnboardingPage);
    fixture.detectChanges();

    return { component: fixture.componentInstance, authServiceStub, navigateSpy };
  }

  // Drives the wizard through steps 1 and 2 so the component is left on step
  // 3 with an interest picked, ready for submit().
  function completeSteps1And2(component: OnboardingPage): void {
    component.selectCampus('Santiago');
    component.selectMajor('Ingeniería Civil Informática');
    component.next();
    component.selectSemester('1° Semestre');
    component.next();
  }

  it('paso 1 sin campus/major: el botón "Siguiente" queda deshabilitado y next() no avanza', () => {
    const { component } = setup();

    expect(component.step()).toBe(1);
    expect(component.canProceed()).toBe(false);

    component.next();

    expect(component.step()).toBe(1);
  });

  it('paso 1 con campus y major: canProceed() es true y next() avanza al paso 2', () => {
    const { component } = setup();

    component.selectCampus('Santiago');
    component.selectMajor('Ingeniería Civil Informática');
    expect(component.canProceed()).toBe(true);

    component.next();

    expect(component.step()).toBe(2);
  });

  it('paso 3 con éxito: updateProfile() incluye onboarding_completed:true y navega a /kit', async () => {
    const { component, authServiceStub, navigateSpy } = setup();

    completeSteps1And2(component);
    component.toggleInterest('Cálculo II');
    expect(component.step()).toBe(3);
    expect(component.canProceed()).toBe(true);

    await component.submit();

    expect(authServiceStub['updateProfile']).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: true, interests: ['Cálculo II'] }),
    );
    expect(navigateSpy).toHaveBeenCalledWith('/kit');
  });

  it('paso 3 con updateProfile() fallando: setea error() y no navega', async () => {
    const { component, navigateSpy } = setup({
      updateProfile: vi.fn().mockResolvedValue({ error: 'boom' }),
    });

    completeSteps1And2(component);
    component.toggleInterest('Cálculo II');

    await component.submit();

    expect(component.error()).toBe('boom');
    expect(component.loading()).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
