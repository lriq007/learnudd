import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addOutline, bookOutline, cashOutline, peopleOutline, starOutline, trendingUpOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { BadgeComponent, type BadgeVariant } from '../shared/ui/badge/badge.component';
import { RatingStarsComponent } from '../shared/ui/rating-stars/rating-stars.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { ButtonComponent } from '../shared/ui/button/button.component';

import { AuthService } from '../shared/state/auth.service';
import { SupabaseService } from '../shared/state/supabase.service';
import type { Note, Tutor } from '../shared/models';
import { formatCLP } from '../shared/utils';

interface CreatorStats {
  totalSales: number;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
}

// Ported 1:1 from src/app/(protected)/profile/creator/page.tsx
// (deferred-work.md:178-179 — CAP-6 excluded this dashboard on purpose; the
// route/link were never wired into ionic-app until this spec).
//
// Per Tasks (profile-creator.page.html bullet): the template only ports the
// stats grid, the conditional tutor section, and the notes list with its
// loading/empty states. The MVP's own top "Profile Summary" card
// (avatar/name/major, page.tsx líneas 118-138) is not in that enumeration
// and is intentionally left out here — /profile already renders that same
// identity block, so this dashboard starts directly at the stats grid.
// Decision documented here (not folded in silently) per this being a
// judgment call the frozen spec's task list implies but doesn't spell out.
//
// Queries: per Boundaries, all 4 MVP queries are replicated exactly,
// including the `.in('note_id', [])` sales query that can never match a row
// (known-issues.md#1 — ingresos/ventas de creador siempre en 0; NOT fixed
// here, per Never). Per the profile-creator.page.ts task bullet, queries run
// in parallel where the MVP cascades them: the MVP awaits the tutor query
// alone first, THEN Promise.all's notes+sales+bookings (bookings gated on
// tutorData for the "sin perfil de tutor" I/O row). Here tutors+notes+sales
// run together in one Promise.all (none of the three actually depend on
// each other), and only bookings — which needs tutorData.id — stays
// sequential after, still skipped entirely when there's no tutor row.
@Component({
  selector: 'app-profile-creator-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    HeaderComponent,
    CardComponent,
    BadgeComponent,
    RatingStarsComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ButtonComponent,
  ],
  templateUrl: './profile-creator.page.html',
  styleUrl: './profile-creator.page.scss',
})
export class ProfileCreatorPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);

  readonly addIcon = addOutline;
  readonly cashIcon = cashOutline;
  readonly trendingUpIcon = trendingUpOutline;
  readonly peopleIcon = peopleOutline;
  readonly starIcon = starOutline;
  readonly bookIcon = bookOutline;

  readonly notes = signal<Note[]>([]);
  readonly tutorProfile = signal<Tutor | null>(null);
  readonly stats = signal<CreatorStats>({ totalSales: 0, totalRevenue: 0, totalBookings: 0, averageRating: 0 });
  readonly loading = signal(true);

  // Skeleton only for the notes list (Boundaries: "sin skeleton para el
  // grid de stats, paridad MVP") — 2 rows, ported from page.tsx's
  // `[1, 2].map(...)` (línea 190).
  readonly skeletonRows = [1, 2];

  readonly formatCLP = formatCLP;

  // Ported 1:1 from statusLabels (page.tsx líneas 95-101).
  readonly statusLabels: Record<Note['status'], string> = {
    active: 'Activo',
    review: 'En revisión',
    paused: 'Pausado',
    rejected: 'Rechazado',
    draft: 'Borrador',
  };

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    const client = this.supabaseService.client;
    if (!userId || !client) {
      this.loading.set(false);
      return;
    }

    const [tutorResult, notesResult, salesResult] = await Promise.all([
      client.from('tutors').select('*, user:profiles(*), courses:tutor_courses(*)').eq('user_id', userId).single(),
      client.from('notes').select('*').eq('author_id', userId).order('created_at', { ascending: false }),
      client.from('library').select('id, note:notes(price)', { count: 'exact' }).in('note_id', []),
    ]);

    const tutorData = (tutorResult.data as Tutor | null) ?? null;
    this.tutorProfile.set(tutorData);
    this.notes.set((notesResult.data as Note[]) || []);

    // I/O matrix: "Sin perfil de tutor" — bookings is only queried when
    // tutorData exists, exactly like the MVP's ternary (page.tsx líneas
    // 61-66), so the "Reservas" stat stays 0 without ever hitting the table.
    const bookingsResult: { count: number | null } = tutorData
      ? await client.from('bookings').select('id', { count: 'exact' }).eq('tutor_id', tutorData.id)
      : { count: 0 };

    const totalSales = salesResult.count || 0;
    // Bug replicated verbatim (known-issues.md#1): salesResult.data is
    // always [] because of the `.in('note_id', [])` filter above, so this
    // reduce never contributes anything — totalRevenue stays 0.
    const totalRevenue = (salesResult.data || []).reduce((sum: number, item: Record<string, unknown>) => {
      const note = item['note'] as Record<string, unknown> | null;
      return sum + ((note?.['price'] as number) || 0);
    }, 0);

    this.stats.set({
      totalSales,
      totalRevenue,
      totalBookings: bookingsResult.count || 0,
      averageRating: tutorData?.average_rating || 0,
    });

    this.loading.set(false);
  }

  // Ported 1:1 from the Badge variant ternary (page.tsx línea 210): only
  // 'active'/'review' get a distinct variant, everything else (paused,
  // rejected, draft) falls back to 'default'.
  noteBadgeVariant(status: Note['status']): BadgeVariant {
    if (status === 'active') return 'success';
    if (status === 'review') return 'warning';
    return 'default';
  }
}
