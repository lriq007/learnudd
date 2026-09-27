import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

// Angular's unit-test runner rejects `vi.mock` on relative imports ("use
// TestBed for mocking dependencies" instead) — so `environment` (a relative
// import) is mutated directly rather than mocked; only the bare-package
// import `@supabase/supabase-js` goes through vi.mock. Non-empty values make
// AuthService build a real (mocked) client and exercise the actual
// "getUser() resolves with no user" branch — not the no-client fallback
// branch, which isn't what this matrix row is about.
// Mirrors the real library's own behavior (throws synchronously when
// supabaseUrl/supabaseAnonKey are falsy) so the guard/catch in
// AuthService's field initializer actually gets exercised by the tests
// below, instead of the mock silently papering over a missing guard.
//
// CAP-1: the mock functions are declared with vi.hoisted so individual tests
// can override one call's resolved value (mockResolvedValueOnce) to exercise
// signInWithPassword/signInWithMagicLink/exchangeCodeForSession/updateProfile
// against their real bodies, instead of only through page-level AuthService
// mocks (which never run this file's own error-message-extraction code).
type AuthErrorResult = { error: { message: string } | null };

const authMocks = vi.hoisted(() => ({
  getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  signInWithPassword: vi.fn(() => Promise.resolve({ error: null } as AuthErrorResult)),
  signInWithOtp: vi.fn(() => Promise.resolve({ error: null } as AuthErrorResult)),
  exchangeCodeForSession: vi.fn(() => Promise.resolve({ error: null } as AuthErrorResult)),
}));

const profilesUpdateEq = vi.hoisted(() => vi.fn(() => Promise.resolve<{ error: { message: string } | null }>({ error: null })));
const profilesUpdate = vi.hoisted(() => vi.fn(() => ({ eq: profilesUpdateEq })));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (url?: string, key?: string) => {
    if (!url || !key) {
      throw new Error('supabaseUrl is required.');
    }
    return {
      auth: authMocks,
      from: (table: string) => {
        if (table !== 'profiles') throw new Error(`unexpected table: ${table}`);
        return { update: profilesUpdate };
      },
    };
  },
}));

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type { Profile } from '../models';

const DEMO_PROFILE: Profile = {
  id: 'u1',
  email: 'martina@udd.cl',
  full_name: 'Martina',
  avatar_url: null,
  campus: null,
  major: null,
  semester: null,
  interests: [],
  verified: false,
  created_at: '2024-01-01',
  onboarding_completed: false,
};

// Covers the CAP-7 spec's I/O matrix row: "AuthService sin sesion".
describe('AuthService', () => {
  it('fetchUser() sin sesion activa deja user()=null y loading()=false, sin excepcion', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'anon-key';

    const service = TestBed.inject(AuthService);

    await expect(service.fetchUser()).resolves.toBeUndefined();

    expect(service.user()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('con las env vars por defecto del proyecto (\'\') no lanza excepcion al construir ni al fetchUser()', async () => {
    environment.supabaseUrl = '';
    environment.supabaseAnonKey = '';

    const service = TestBed.inject(AuthService);

    await expect(service.fetchUser()).resolves.toBeUndefined();

    expect(service.user()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  // CAP-1: session methods, exercised against their real bodies (not just
  // through page-level AuthService mocks).
  it('signInWithPassword() surfaces error.message on failure', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'anon-key';
    authMocks.signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });

    const service = TestBed.inject(AuthService);
    const result = await service.signInWithPassword('martina@udd.cl', 'wrong-password');

    expect(result).toEqual({ error: 'Invalid login credentials' });
  });

  it('signInWithMagicLink() surfaces error.message on failure', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'anon-key';
    authMocks.signInWithOtp.mockResolvedValueOnce({ error: { message: 'rate limited' } });

    const service = TestBed.inject(AuthService);
    const result = await service.signInWithMagicLink('martina@udd.cl');

    expect(result).toEqual({ error: 'rate limited' });
  });

  it('exchangeCodeForSession() surfaces error.message on failure', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'anon-key';
    authMocks.exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'invalid code' } });

    const service = TestBed.inject(AuthService);
    const result = await service.exchangeCodeForSession('bad-code');

    expect(result).toEqual({ error: 'invalid code' });
  });

  it('updateProfile() en éxito mergea el update en el signal user() local', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'anon-key';
    profilesUpdateEq.mockResolvedValueOnce({ error: null });

    const service = TestBed.inject(AuthService);
    service.setUser(DEMO_PROFILE);

    const result = await service.updateProfile({ campus: 'Santiago', onboarding_completed: true });

    expect(result).toEqual({ error: null });
    expect(service.user()?.campus).toBe('Santiago');
    expect(service.user()?.onboarding_completed).toBe(true);
    expect(profilesUpdate).toHaveBeenCalledWith({ campus: 'Santiago', onboarding_completed: true });
    expect(profilesUpdateEq).toHaveBeenCalledWith('id', DEMO_PROFILE.id);
  });
});
