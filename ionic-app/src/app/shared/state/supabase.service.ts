import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// CAP-2: extracted from AuthService's own private `supabase` field (CAP-1)
// now that a second domain — notes/tutors/favorites — needs the same
// Supabase client (Approach: "primera vez que más de un dominio necesita el
// cliente"). Ports the exact null-fallback construction AuthService already
// had verbatim (Boundaries: "SupabaseService porta tal cual el patrón
// null-fallback de AuthService"): the client is `null` if the env vars are
// missing or `createClient` throws, and this service never throws toward a
// caller either.
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly _client: SupabaseClient | null = (() => {
    if (!environment.supabaseUrl || !environment.supabaseAnonKey) return null;
    try {
      return createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    } catch {
      return null;
    }
  })();

  get client(): SupabaseClient | null {
    return this._client;
  }
}
