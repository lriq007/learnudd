import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { Favorite } from '../models';

// CAP-2: query ported from src/app/(protected)/favorites/page.tsx (líneas
// 26-30). Same null-client → `[]` fail-soft as Notes/TutorsService.
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchAll(userId: string): Promise<Favorite[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('favorites')
      .select('*, note:notes(*, author:profiles(*)), tutor:tutors(*, user:profiles(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data as Favorite[] | null) ?? [];
  }

  // CAP-3: ported from the note detail page's inline favorite check
  // (src/app/(protected)/explore/notes/[id]/page.tsx líneas 56-65). `.single()`
  // mirrors the MVP: no matching row resolves `data` to null/undefined
  // instead of throwing, so a missing favorite is just `false`.
  async checkFavorite(userId: string, noteId: string): Promise<boolean> {
    const client = this.supabaseService.client;
    if (!client) return false;

    const { data } = await client
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .single();

    return !!data;
  }

  // CAP-3: ported from the note detail page's inline toggle
  // (src/app/(protected)/explore/notes/[id]/page.tsx líneas 102-119). Follows
  // the {error} mutation pattern already used by AuthService; per Boundaries
  // ("paridad, sin manejo de error") the MVP itself never checks this result
  // before flipping its optimistic `isFavorite` state, and the caller here
  // does the same — the return value exists for the pattern, not because a
  // caller is required to branch on it.
  async toggle(userId: string, noteId: string, isFavorite: boolean): Promise<{ error: string | null }> {
    const client = this.supabaseService.client;
    if (!client) return { error: 'Supabase no está configurado' };

    if (isFavorite) {
      const { error } = await client.from('favorites').delete().eq('user_id', userId).eq('note_id', noteId);
      return { error: error ? error.message : null };
    }

    const { error } = await client.from('favorites').insert({ user_id: userId, note_id: noteId });
    return { error: error ? error.message : null };
  }
}
