import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { CallbackPage } from './callback.page';
import { AuthService } from '../../shared/state/auth.service';

// Covers the CAP-1 spec's I/O matrix rows for callback ("Callback sin sesión",
// "Callback exchange falla") plus the two post-exchange redirect branches
// from protectedGuard's ordering (onboarding incomplete / complete).
describe('CallbackPage', () => {
  function setup(authOverrides: Record<string, unknown> = {}) {
    const authServiceStub = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      fetchUser: vi.fn().mockResolvedValue(undefined),
      user: vi.fn().mockReturnValue(null),
      ...authOverrides,
    };

    TestBed.configureTestingModule({
      imports: [CallbackPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }],
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(CallbackPage);

    return { component: fixture.componentInstance, navigateSpy, authServiceStub };
  }

  // Calls ngOnInit() directly and awaits its returned promise instead of
  // going through fixture.detectChanges()/whenStable(): this app runs
  // zoneless (no zone.js dependency), so stability tracking isn't tied to
  // plain promise chains that never touch a signal — awaiting the lifecycle
  // method itself is the deterministic way to observe its side effects.
  it('callback sin sesión: redirige a /login sin query param', async () => {
    const { component, navigateSpy } = setup({ user: vi.fn().mockReturnValue(null) });

    await component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('callback exchange falla: redirige a /login?error=auth_failed y no llama fetchUser()', async () => {
    const { component, navigateSpy, authServiceStub } = setup({
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: 'exchange failed' }),
    });

    await component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith('/login?error=auth_failed');
    expect(authServiceStub['fetchUser']).not.toHaveBeenCalled();
  });

  it('con usuario y onboarding_completed=false: redirige a /onboarding', async () => {
    const { component, navigateSpy } = setup({
      user: vi.fn().mockReturnValue({ id: 'u1', onboarding_completed: false }),
    });

    await component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith('/onboarding');
  });

  it('con usuario y onboarding_completed=true: redirige a /kit', async () => {
    const { component, navigateSpy } = setup({
      user: vi.fn().mockReturnValue({ id: 'u1', onboarding_completed: true }),
    });

    await component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith('/kit');
  });
});
