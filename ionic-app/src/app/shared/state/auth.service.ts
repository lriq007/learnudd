import { Injectable, inject, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import type { Profile } from '../models';

// Ported from src/stores/authStore.ts (Zustand) to an injectable signal-based
// service. Uses @supabase/supabase-js directly (no @supabase/ssr — that
// package is Next.js-server-specific and doesn't apply to an Angular client,
// per Code Map).
//
// Found while verifying against the Acceptance Criteria ("/kit ... sin
// errores de consola"): @supabase/supabase-js's createClient() throws
// SYNCHRONOUSLY when supabaseUrl is empty — since the real env values live
// in an untracked .env.local this session doesn't have (see environment.ts),
// that threw on every app load, not just inside fetchUser(). Fixed by only
// constructing the client when both values are configured, AND wrapping the
// call itself in try/catch (a non-empty but malformed URL still throws
// synchronously); fetchUser()/signOut() treat a missing client the same as
// "no active session" instead of throwing, which is also the honest
// behavior when Supabase isn't wired up (or is misconfigured) at all.
//
// CAP-2: the client construction itself moved to SupabaseService (Boundaries
// — a 2nd domain, notes/tutors/favorites, now needs it too, so it can no
// longer live only inside this service). This class keeps the exact same
// private `supabase` accessor name/shape and every public signature —
// "sin cambiar ninguna de sus firmas ni su comportamiento observable".
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);

  private get supabase(): SupabaseClient | null {
    return this.supabaseService.client;
  }

  private readonly _user = signal<Profile | null>(null);
  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();

  setUser(user: Profile | null): void {
    this._user.set(user);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  async fetchUser(): Promise<void> {
    if (!this.supabase) {
      this._user.set(null);
      this._loading.set(false);
      return;
    }

    try {
      const {
        data: { user: authUser },
      } = await this.supabase.auth.getUser();

      if (!authUser) {
        this._user.set(null);
        this._loading.set(false);
        return;
      }

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      this._user.set((profile as Profile) ?? null);
      this._loading.set(false);
    } catch {
      // No active session / unreachable Supabase project both resolve the
      // same way as "no user" — never throw.
      this._user.set(null);
      this._loading.set(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase?.auth.signOut();
    } catch {
      // A rejected signOut() still means "no longer signed in" locally —
      // never let it reject the returned promise (kit.page.html calls this
      // unhandled from a template event binding).
    } finally {
      this._user.set(null);
      this._loading.set(false);
    }
  }

  // --- CAP-1: session methods, ported from src/app/(auth)/login/page.tsx
  // and src/app/(auth)/callback/page.tsx. All three return { error: string |
  // null } instead of the raw Supabase AuthError so login/callback pages
  // don't need to import supabase-js types (the client stays private to this
  // service, per Boundaries). Message normalization ("Invalid" → "Correo o
  // contraseña incorrectos") is left to the caller (login.page.ts), same as
  // the MVP does it in the component, not the store.

  async signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
    if (!this.supabase) return { error: 'Supabase no está configurado' };
    try {
      const { error } = await this.supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // emailRedirectTo points at /callback (the route this spec actually
  // creates) — Decision documented in Boundaries & Design Notes: the MVP
  // points at /auth/callback, a page that was never real in either app.
  async signInWithMagicLink(email: string): Promise<{ error: string | null }> {
    if (!this.supabase) return { error: 'Supabase no está configurado' };
    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/callback` },
      });
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  async exchangeCodeForSession(url: string): Promise<{ error: string | null }> {
    if (!this.supabase) return { error: 'Supabase no está configurado' };
    try {
      const { error } = await this.supabase.auth.exchangeCodeForSession(url);
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Decision (documented, not silent — Code Map only calls out the 3 session
  // methods above): onboarding's wizard needs to persist to `profiles`, but
  // Boundaries keeps the Supabase client encapsulated in this service ("no
  // se extrae un SupabaseService compartido"). Rather than leaking the
  // client out to onboarding.page.ts, this method does the update AND syncs
  // the result into the local `user` signal, so the very next guard
  // evaluation (redirect to /kit) already sees onboarding_completed: true
  // without a second round-trip to Supabase.
  async updateProfile(updates: Partial<Profile>): Promise<{ error: string | null }> {
    if (!this.supabase) return { error: 'Supabase no está configurado' };
    const currentUser = this._user();
    if (!currentUser) return { error: 'No hay sesión activa' };

    try {
      const { error } = await this.supabase.from('profiles').update(updates).eq('id', currentUser.id);

      if (error) return { error: error.message };

      this._user.set({ ...currentUser, ...updates });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }
}
