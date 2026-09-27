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
}
