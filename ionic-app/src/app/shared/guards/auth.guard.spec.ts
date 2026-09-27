import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';

import { protectedGuard, guestGuard } from './auth.guard';
import { AuthService } from '../state/auth.service';

// CanActivateFn is a plain function that calls inject() internally, so it
// must run inside an Angular injection context — TestBed.runInInjectionContext
// provides that without needing a full route navigation.
describe('auth.guard', () => {
  function setup(user: unknown) {
    const authServiceStub = { user: vi.fn().mockReturnValue(user) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }],
    });

    const router = TestBed.inject(Router);
    return { router };
  }

  function routeWithPath(path: string): ActivatedRouteSnapshot {
    return { routeConfig: { path } } as ActivatedRouteSnapshot;
  }

  const state = {} as RouterStateSnapshot;

  describe('protectedGuard', () => {
    it('sin user(): redirige a /login', () => {
      const { router } = setup(null);

      const result = TestBed.runInInjectionContext(() => protectedGuard(routeWithPath('kit'), state));

      expect(result).toEqual(router.parseUrl('/login'));
    });

    it('con user() sin onboarding_completed en una ruta que no es /onboarding: redirige a /onboarding', () => {
      const { router } = setup({ id: 'u1', onboarding_completed: false });

      const result = TestBed.runInInjectionContext(() => protectedGuard(routeWithPath('kit'), state));

      expect(result).toEqual(router.parseUrl('/onboarding'));
    });

    it('con ese mismo user() evaluando la propia ruta /onboarding: no redirige (caso anti-loop)', () => {
      setup({ id: 'u1', onboarding_completed: false });

      const result = TestBed.runInInjectionContext(() => protectedGuard(routeWithPath('onboarding'), state));

      expect(result).toBe(true);
    });

    it('con user() y onboarding_completed=true: no redirige', () => {
      setup({ id: 'u1', onboarding_completed: true });

      const result = TestBed.runInInjectionContext(() => protectedGuard(routeWithPath('kit'), state));

      expect(result).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('con user(): redirige a /kit', () => {
      const { router } = setup({ id: 'u1', onboarding_completed: true });

      const result = TestBed.runInInjectionContext(() => guestGuard(routeWithPath('login'), state));

      expect(result).toEqual(router.parseUrl('/kit'));
    });

    it('sin user(): no redirige', () => {
      setup(null);

      const result = TestBed.runInInjectionContext(() => guestGuard(routeWithPath('login'), state));

      expect(result).toBe(true);
    });
  });
});
