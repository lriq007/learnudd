import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { LibraryItem, Note, NoteRating } from '../models';

export interface NotesSearchParams {
  query: string;
  major: string;
  materialType: string;
}

// CAP-2: queries ported from src/app/(protected)/page.tsx (fetchHome, líneas
// 25-31) and src/app/(protected)/explore/page.tsx (search, líneas 46-63).
// Per Boundaries/Never: no error handling beyond the MVP's own `data ?? []`
// (Supabase errors are ignored, not surfaced) — that's paridad fiel, not a
// gap this spec introduces. A `null` client (Supabase not configured, same
// null-fallback SupabaseService/AuthService already use) resolves to `[]`
// instead of throwing, so callers never need to guard against a missing
// client themselves.
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchHome(): Promise<Note[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('notes')
      .select('*, author:profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    return (data as Note[] | null) ?? [];
  }

  async search(params: NotesSearchParams): Promise<Note[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    let query = client.from('notes').select('*, author:profiles(*)').eq('status', 'active');

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,course.ilike.%${params.query}%`);
    }
    if (params.major) {
      query = query.eq('major', params.major);
    }
    if (params.materialType) {
      query = query.eq('material_type', params.materialType);
    }

    const { data } = await query.order('created_at', { ascending: false });
    return (data as Note[] | null) ?? [];
  }

  // CAP-3: ported from src/app/(protected)/explore/notes/[id]/page.tsx
  // (fetchNote, líneas 38-46). `.single()` mirrors the MVP: a non-existent
  // id resolves `data` to null/undefined instead of throwing, same fail-soft
  // null-client convention as the other reads on this service.
  async getById(id: string): Promise<Note | null> {
    const client = this.supabaseService.client;
    if (!client) return null;

    const { data } = await client.from('notes').select('*, author:profiles(*)').eq('id', id).single();
    return (data as Note | null) ?? null;
  }

  // CAP-3: ported from src/app/(protected)/explore/notes/[id]/page.tsx
  // (fetchNote, líneas 48-54).
  async getRatings(noteId: string): Promise<NoteRating[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('note_ratings')
      .select('*, user:profiles(*)')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false });

    return (data as NoteRating[] | null) ?? [];
  }

  // CAP-3: ported from src/app/(protected)/library/page.tsx (fetchLibrary,
  // líneas 26-39).
  async listPurchased(userId: string): Promise<LibraryItem[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('library')
      .select('*, note:notes(*, author:profiles(*))')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    return (data as LibraryItem[] | null) ?? [];
  }

  // CAP-3: ported from src/app/(protected)/explore/notes/[id]/page.tsx
  // (handlePurchase, líneas 73-100). Per Boundaries: "compra" is a simulated
  // 1500ms delay + a direct insert into `library` — no real payment gateway,
  // no `payments` table involved. Per the {error} mutation pattern
  // (AuthService): a null client fails the same way a configured client
  // would report a broken request, no separate signal needed by callers.
  // No try/catch around the Supabase calls themselves — same as the MVP,
  // which only checks the returned `error` field, never catches a network
  // rejection (Never: no added network error handling beyond MVP parity).
  async purchase(userId: string, note: Note): Promise<{ error: string | null }> {
    const client = this.supabaseService.client;
    if (!client) return { error: 'Error al procesar el pago' };

    // Simulate payment — no real gateway integration (Never).
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { error } = await client.from('library').insert({ user_id: userId, note_id: note.id });

    if (error) return { error: 'Error al procesar el pago' };

    await client
      .from('notes')
      .update({ downloads: (note.downloads || 0) + 1 })
      .eq('id', note.id);

    return { error: null };
  }
}
