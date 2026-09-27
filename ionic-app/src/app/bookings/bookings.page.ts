import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { calendarOutline, chatbubbleOutline, locationOutline, timeOutline, videocamOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { BadgeComponent, type BadgeVariant } from '../shared/ui/badge/badge.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';

import { AuthService } from '../shared/state/auth.service';
import { BookingsService } from '../shared/state/bookings.service';
import type { Booking, BookingStatus } from '../shared/models';
import { formatCLP, getInitials } from '../shared/utils';

export type BookingTab = 'upcoming' | 'past';

// Ported 1:1 from src/app/(protected)/bookings/page.tsx. Per Never: read-only
// (no cancel/edit) — this page only lists and, indirectly via tutor-detail,
// creates. No <app-navbar> here, same as the MVP (BookingsPage never renders
// <Navbar />) — it's a detail-list sub-page, not a tab-level destination.
@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    HeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './bookings.page.html',
  styleUrl: './bookings.page.scss',
})
export class BookingsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly bookingsService = inject(BookingsService);
  private readonly router = inject(Router);

  readonly calendarIcon = calendarOutline;
  readonly timeIcon = timeOutline;
  readonly videoIcon = videocamOutline;
  readonly locationIcon = locationOutline;
  readonly chatIcon = chatbubbleOutline;

  readonly activeTab = signal<BookingTab>('upcoming');
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2];

  readonly statusLabels: Record<BookingStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  readonly formatCLP = formatCLP;
  readonly getInitials = getInitials;

  // I/O matrix: "Reservas del estudiante" — tabs Próximas/Anteriores,
  // filtered client-side by status/fecha, ported 1:1 from BookingsPage
  // líneas 45-54.
  readonly upcoming = computed(() => {
    const now = new Date();
    return this.bookings().filter(
      (b) => b.status !== 'cancelled' && b.status !== 'completed' && (!b.schedule || new Date(b.schedule.date) >= now),
    );
  });

  readonly past = computed(() => {
    const now = new Date();
    return this.bookings().filter(
      (b) => b.status === 'cancelled' || b.status === 'completed' || (!!b.schedule && new Date(b.schedule.date) < now),
    );
  });

  readonly filtered = computed(() => (this.activeTab() === 'upcoming' ? this.upcoming() : this.past()));

  // I/O matrix: "Reservas vacías en una tab" — EmptyStateComponent with a
  // CTA to /explore.
  readonly emptyTitle = computed(() =>
    this.activeTab() === 'upcoming' ? 'No tienes reservas próximas' : 'No hay reservas anteriores',
  );

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.bookings.set(await this.bookingsService.listForStudent(userId));
    this.loading.set(false);
  }

  setTab(tab: BookingTab): void {
    this.activeTab.set(tab);
  }

  badgeVariant(status: BookingStatus): BadgeVariant {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  }

  // Ported from the EmptyState CTA's `<Link href="/explore?tab=tutors">`
  // (bookings/page.tsx línea 174) — lands on the "Clases" tab, not notes.
  goExplore(): void {
    void this.router.navigateByUrl('/explore?tab=tutors');
  }

  // Ported from `<Link href={/messages/${booking.tutor?.user_id}}>` — the
  // /messages/:id route doesn't exist yet (CAP-5, diferido per Boundaries),
  // so this falls into the app's catch-all like the tutor detail page's own
  // message button does.
  goToChat(userId: string | undefined): void {
    if (!userId) return;
    void this.router.navigateByUrl(`/messages/${userId}`);
  }

  formatBookingDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }
}
