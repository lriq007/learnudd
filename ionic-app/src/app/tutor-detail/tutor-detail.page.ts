import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import {
  businessOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircle,
  locationOutline,
  schoolOutline,
  star,
  timeOutline,
  videocamOutline,
} from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { BadgeComponent } from '../shared/ui/badge/badge.component';
import { RatingStarsComponent } from '../shared/ui/rating-stars/rating-stars.component';
import { VerifiedBadgeComponent } from '../shared/ui/verified-badge/verified-badge.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';

import { AuthService } from '../shared/state/auth.service';
import { TutorsService } from '../shared/state/tutors.service';
import { BookingsService } from '../shared/state/bookings.service';
import type { Tutor, TutorRating, TutorSchedule } from '../shared/models';
import { formatCLP, getInitials } from '../shared/utils';

// Ported 1:1 from src/app/(protected)/explore/tutors/[id]/page.tsx. Per
// Code Map: no EmptyStateComponent for "Tutor no encontrado" — a plain
// centered paragraph, same pattern note-detail.page.ts already established
// for "Apunte no encontrado". Route-reactivity (currentId dedupe on
// route.paramMap) follows the same review fix note-detail.page.ts documents.
@Component({
  selector: 'app-tutor-detail-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    HeaderComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    RatingStarsComponent,
    VerifiedBadgeComponent,
    SkeletonComponent,
    ToastComponent,
  ],
  templateUrl: './tutor-detail.page.html',
  styleUrl: './tutor-detail.page.scss',
})
export class TutorDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly tutorsService = inject(TutorsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly destroyRef = inject(DestroyRef);

  // Same route-reuse dedupe as note-detail.page.ts's `currentId`.
  private currentId: string | null = null;

  readonly calendarIcon = calendarOutline;
  readonly timeIcon = timeOutline;
  readonly videoIcon = videocamOutline;
  readonly businessIcon = businessOutline;
  readonly checkIcon = checkmarkCircle;
  readonly chatIcon = chatbubbleOutline;
  readonly starIcon = star;
  readonly locationIcon = locationOutline;
  readonly schoolIcon = schoolOutline;

  readonly tutor = signal<Tutor | null>(null);
  readonly schedules = signal<TutorSchedule[]>([]);
  readonly ratings = signal<TutorRating[]>([]);
  readonly loading = signal(true);
  readonly selectedSchedule = signal<string | null>(null);
  readonly booking = signal(false);

  readonly toastOpen = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('');

  readonly formatCLP = formatCLP;
  readonly getInitials = getInitials;

  readonly headerTitle = computed(() => {
    if (this.loading()) return 'Tutor';
    if (!this.tutor()) return 'No encontrado';
    return 'Perfil del tutor';
  });

  readonly authorInitials = computed(() => getInitials(this.tutor()?.user?.full_name || 'TU'));
  readonly visibleRatings = computed(() => this.ratings().slice(0, 5));
  readonly isOnline = computed(() => this.tutor()?.modalities.includes('online') ?? false);
  readonly isPresencial = computed(() => this.tutor()?.modalities.includes('presencial') ?? false);

  async ngOnInit(): Promise<void> {
    const initialId = this.route.snapshot.paramMap.get('id');
    this.currentId = initialId;

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id === this.currentId) return;
      this.currentId = id;
      void this.loadTutor(id);
    });

    await this.loadTutor(initialId);
  }

  // Review fix: reset any schedule selected for the *previous* tutor before
  // loading the new one — otherwise `selectedSchedule` survives a route
  // `:id` change (same component instance reused by the router) and can
  // point at a schedule id that doesn't belong to `schedules()` anymore.
  private async loadTutor(id: string | null): Promise<void> {
    this.selectedSchedule.set(null);

    if (!id) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const tutorData = await this.tutorsService.getById(id);
    // Review fix: discard a stale response — if the route's `:id` changed
    // again while this call was in flight, a slower earlier response must
    // not overwrite the newer tutor's already-rendered data.
    if (id !== this.currentId) return;
    this.tutor.set(tutorData);

    if (tutorData) {
      const [schedules, ratings] = await Promise.all([
        this.bookingsService.getSchedules(id),
        this.bookingsService.getRatings(id),
      ]);
      if (id !== this.currentId) return;
      this.schedules.set(schedules);
      this.ratings.set(ratings);
    } else {
      this.schedules.set([]);
      this.ratings.set([]);
    }

    this.loading.set(false);
  }

  selectSchedule(scheduleId: string): void {
    this.selectedSchedule.set(this.selectedSchedule() === scheduleId ? null : scheduleId);
  }

  // I/O matrix: "Reservar horario" / "Sin horario seleccionado" (button
  // disabled in the template via [disabled]="!selectedSchedule()"). Ported
  // 1:1 from handleBooking (líneas 79-112): the `schedule` lookup guard
  // fires after `booking.set(true)`, same order as the MVP. `loadTutor()`
  // now resets `selectedSchedule` on every tutor change, so this guard
  // shouldn't be reachable in practice — but unlike the MVP, it doesn't
  // leave `booking()` stuck `true` forever with no feedback if it ever is.
  async handleBooking(): Promise<void> {
    const tutor = this.tutor();
    const userId = this.auth.user()?.id;
    const scheduleId = this.selectedSchedule();
    if (!tutor || !userId || !scheduleId) return;

    this.booking.set(true);

    const schedule = this.schedules().find((s) => s.id === scheduleId);
    if (!schedule) {
      this.showToast('error', 'Error al crear la reserva');
      this.booking.set(false);
      return;
    }

    const { error } = await this.bookingsService.create(userId, tutor, scheduleId);

    if (error) {
      this.showToast('error', 'Error al crear la reserva');
    } else {
      this.showToast('success', '¡Reserva creada! Revisa tus mensajes.');
      this.selectedSchedule.set(null);
    }

    this.booking.set(false);
  }

  goToMessages(): void {
    void this.router.navigateByUrl('/messages');
  }

  formatScheduleDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }

  private showToast(type: ToastType, message: string): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
