import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { Note } from '../models';

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
}
