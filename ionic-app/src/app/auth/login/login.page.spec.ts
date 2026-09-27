import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { LoginPage } from './login.page';
import { AuthService } from '../../shared/state/auth.service';

// Covers the CAP-1 spec's I/O matrix rows for login/magic-link:
// "Email no institucional", "Password incorrecto", "Magic link enviado".
describe('LoginPage', () => {
  function setup(authOverrides: Record<string, unknown> = {}) {
    const authServiceStub = {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithMagicLink: vi.fn().mockResolvedValue({ error: null }),
      fetchUser: vi.fn().mockResolvedValue(undefined),
      ...authOverrides,
    };

    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }],
    });

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    return { component: fixture.componentInstance, authServiceStub };
  }

  it('email no institucional: no llama a Supabase y muestra el error inline', async () => {
    const { component, authServiceStub } = setup();
    component.email.set('persona@gmail.com');
    component.password.set('cualquiera');

    await component.submit();

    expect(authServiceStub['signInWithPassword']).not.toHaveBeenCalled();
    expect(authServiceStub['signInWithMagicLink']).not.toHaveBeenCalled();
    expect(component.error()).toBe('Solo se aceptan correos institucionales @udd.cl');
  });

  it('password incorrecto: normaliza el mensaje a "Correo o contraseña incorrectos"', async () => {
    const { component } = setup({
      signInWithPassword: vi.fn().mockResolvedValue({ error: 'Invalid login credentials' }),
    });
    component.email.set('martina@udd.cl');
    component.password.set('wrong-password');

    await component.submit();

    expect(component.error()).toBe('Correo o contraseña incorrectos');
  });

  it('password correcto: refresca la sesión (fetchUser) antes de navegar a /kit', async () => {
    const { component, authServiceStub } = setup();
    component.email.set('martina@udd.cl');
    component.password.set('test123456');

    await component.submit();

    // Bug guard: sin este fetchUser(), protectedGuard vería auth.user() en
    // null al evaluar /kit y rebotaría de vuelta a /login.
    expect(authServiceStub['fetchUser']).toHaveBeenCalled();
    expect(component.error()).toBe('');
  });

  it('magic link enviado: muestra la pantalla "Revisa tu correo"', async () => {
    const { component } = setup({
      signInWithMagicLink: vi.fn().mockResolvedValue({ error: null }),
    });
    component.mode.set('magic');
    component.email.set('martina@udd.cl');

    await component.submit();

    expect(component.success()).toBe(true);
    expect(component.error()).toBe('');
  });
});
