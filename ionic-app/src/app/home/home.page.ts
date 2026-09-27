import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { bookOutline, peopleOutline, searchOutline, starOutline, timeOutline, trendingUpOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { NoteCardComponent } from '../shared/ui/note-card/note-card.component';
import { TutorCardComponent } from '../shared/ui/tutor-card/tutor-card.component';

import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import { TutorsService } from '../shared/state/tutors.service';
import type { Note, Tutor } from '../shared/models';

// Ported from src/app/(protected)/page.tsx. `/` (route '') replaces the
// CAP-1 temporary redirect to /kit, per this spec's Approach.
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonIcon,
    HeaderComponent,
    NavbarComponent,
    CardComponent,
    SkeletonComponent,
    NoteCardComponent,
    TutorCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notesService = inject(NotesService);
  private readonly tutorsService = inject(TutorsService);

  readonly searchIcon = searchOutline;
  readonly bookIcon = bookOutline;
  readonly peopleIcon = peopleOutline;
  readonly trendingUpIcon = trendingUpOutline;
  readonly starIcon = starOutline;
  readonly timeIcon = timeOutline;

  readonly notes = signal<Note[]>([]);
  readonly tutors = signal<Tutor[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3];
  readonly compactSkeletonRows = [1, 2, 3];
  readonly tutorSkeletonRows = [1, 2];

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  readonly firstName = computed(() => this.auth.user()?.full_name?.split(' ')[0] || 'Estudiante');

  // I/O matrix: "Home sin notas/tutores" — with notes()/tutors() empty (both
  // queries resolved []), these just come back empty too; the template has
  // no @empty branch for any of the 3 sections (paridad fiel: the MVP
  // doesn't handle this case either).
  readonly courseNotes = computed(() => this.notes().slice(0, 3));
  readonly topRatedNotes = computed(() =>
    this.notes()
      .filter((n) => (n.average_rating || 0) >= 4.5)
      .slice(0, 4),
  );

  async ngOnInit(): Promise<void> {
    const [notes, tutors] = await Promise.all([this.notesService.fetchHome(), this.tutorsService.fetchHome()]);
    this.notes.set(notes);
    this.tutors.set(tutors);
    this.loading.set(false);
  }

  // Home's tutor card subtitle: course vs. Explore's/Favoritos' formats
  // differ per Design Notes, so each page formats its own string.
  tutorSubtitle(tutor: Tutor): string {
    return `${tutor.user?.major ?? ''} · ${tutor.courses?.[0]?.course_name || 'Varios ramos'}`;
  }
}
