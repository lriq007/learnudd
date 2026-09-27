import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { CreateTutorInput, Tutor } from '../models';

export interface TutorsSearchParams {
  query: string;
  major: string;
}

// CAP-2: queries ported from src/app/(protected)/page.tsx (fetchHome, líneas
// 32-36) and src/app/(protected)/explore/page.tsx (search, líneas 64-85).
// Per Never: the nested-relation filter on `search()` (`.or()` on the
// `user`/`courses` joins, `.contains('courses.major', ...)`) is ported
// literally, unverified against a real Supabase project — flagged in
// deferred-work.md, not "fixed blind" here. Same null-client → `[]`
// fail-soft as NotesService/SupabaseService.
@Injectable({ providedIn: 'root' })
export class TutorsService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchHome(): Promise<Tutor[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('tutors')
      .select('*, user:profiles(*), courses:tutor_courses(*)')
      .eq('verified', true)
      .limit(3);

    return (data as Tutor[] | null) ?? [];
  }

  async search(params: TutorsSearchParams): Promise<Tutor[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    let query = client.from('tutors').select('*, user:profiles(*), courses:tutor_courses(*)').eq('verified', true);

    if (params.query) {
      query = query.or(`user.full_name.ilike.%${params.query}%,courses.course_name.ilike.%${params.query}%`);
    }
    if (params.major) {
      query = query.contains('courses.major', [params.major]);
    }

    const { data } = await query;
    return (data as Tutor[] | null) ?? [];
  }

  // CAP-4: ported from src/app/(protected)/explore/tutors/[id]/page.tsx
  // (fetchTutor, líneas 44-51). Same null-client / `.single()` fail-soft
  // convention as NotesService.getById().
  async getById(id: string): Promise<Tutor | null> {
    const client = this.supabaseService.client;
    if (!client) return null;

    const { data } = await client
      .from('tutors')
      .select('*, user:profiles(*), courses:tutor_courses(*)')
      .eq('id', id)
      .single();

    return (data as Tutor | null) ?? null;
  }

  // CAP-4 (resto, spec-cap-4-publish-tutor): ported from
  // src/app/(protected)/publish/tutor/page.tsx (handleSubmit, líneas 60-102).
  // Per Boundaries: two sequential inserts, same {error} mutation pattern as
  // NotesService.create() -- a null client and a failed `tutors` insert both
  // resolve to the same generic message, no try/catch. The second insert
  // (`tutor_courses`, filtered to complete rows) is fire-and-forget: its
  // error is never checked, matching the MVP exactly (no `tutor_courses`
  // insert is attempted at all when the `tutors` insert itself fails).
  async create(userId: string, data: CreateTutorInput): Promise<{ error: string | null }> {
    const client = this.supabaseService.client;
    if (!client) return { error: 'Error al crear perfil de tutor' };

    const { data: tutor, error: tutorError } = await client
      .from('tutors')
      .insert({
        user_id: userId,
        bio: data.bio,
        experience: data.experience || null,
        hourly_price: data.hourly_price,
        campus: data.campus,
        modalities: data.modalities,
        verified: false,
      })
      .select()
      .single();

    if (tutorError || !tutor) return { error: 'Error al crear perfil de tutor' };

    const coursesToInsert = data.courses
      .filter((c) => c.course_name && c.major)
      .map((c) => ({
        tutor_id: (tutor as { id: string }).id,
        course_name: c.course_name,
        major: c.major,
      }));

    if (coursesToInsert.length > 0) {
      await client.from('tutor_courses').insert(coursesToInsert);
    }

    return { error: null };
  }
}
