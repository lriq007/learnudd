import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { Booking, Tutor, TutorRating, TutorSchedule } from '../models';

// CAP-4: queries/mutations ported from
// src/app/(protected)/explore/tutors/[id]/page.tsx (getSchedules/getRatings:
// fetchTutor líneas 52-65; create: handleBooking líneas 79-112) and
// src/app/(protected)/bookings/page.tsx (listForStudent: fetchBookings
// líneas 30-40). Same null-client fail-soft convention as
// NotesService/TutorsService/FavoritesService; create() follows the
// `{error}` mutation pattern already used by NotesService.purchase().
@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly supabaseService = inject(SupabaseService);

  // CAP-4: ported from tutor detail's fetchTutor (líneas 54-62). Only
  // schedules `available = true` and `date >= hoy`, ordered ascending and
  // capped at 10 — 1:1 with the MVP query.
  async getSchedules(tutorId: string): Promise<TutorSchedule[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const today = new Date().toISOString().split('T')[0];
    const { data } = await client
      .from('tutor_schedules')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('available', true)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(10);

    return (data as TutorSchedule[] | null) ?? [];
  }

  // CAP-4: ported from tutor detail's fetchTutor (líneas 63-67).
  async getRatings(tutorId: string): Promise<TutorRating[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('tutor_ratings')
      .select('*, user:profiles(*)')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    return (data as TutorRating[] | null) ?? [];
  }

  // CAP-4: ported from tutor detail's handleBooking (líneas 87-109). Per
  // Boundaries: no payment gateway — payment_status stays 'pending'; no
  // transaction around the insert + the `tutor_schedules.available = false`
  // update (same known race condition as the MVP, deferred per Never). A
  // failed insert never attempts the update, same order as the MVP (the
  // update only runs in the `else` branch of the insert's error check).
  async create(userId: string, tutor: Tutor, scheduleId: string): Promise<{ error: string | null }> {
    const client = this.supabaseService.client;
    if (!client) return { error: 'Error al crear la reserva' };

    const { error } = await client.from('bookings').insert({
      student_id: userId,
      tutor_id: tutor.id,
      schedule_id: scheduleId,
      course: tutor.courses?.[0]?.course_name || 'General',
      modality: tutor.modalities.includes('online') ? 'online' : 'presencial',
      status: 'pending',
      payment_status: 'pending',
      payment_amount: tutor.hourly_price,
    });

    if (error) return { error: 'Error al crear la reserva' };

    await client.from('tutor_schedules').update({ available: false }).eq('id', scheduleId);

    return { error: null };
  }

  // CAP-4: ported from bookings/page.tsx's fetchBookings (líneas 32-38).
  async listForStudent(userId: string): Promise<Booking[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('bookings')
      .select('*, tutor:tutors(*, user:profiles(*)), schedule:tutor_schedules(*)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    return (data as Booking[] | null) ?? [];
  }
}
