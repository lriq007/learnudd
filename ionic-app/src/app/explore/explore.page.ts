import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonSelect, IonSelectOption } from '@ionic/angular';
import { bookOutline, closeOutline, funnelOutline, peopleOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { InputComponent } from '../shared/ui/input/input.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { NoteCardComponent } from '../shared/ui/note-card/note-card.component';
import { TutorCardComponent } from '../shared/ui/tutor-card/tutor-card.component';

import { NotesService } from '../shared/state/notes.service';
import { TutorsService } from '../shared/state/tutors.service';
import { MAJOR_OPTIONS, MATERIAL_TYPE_LABELS, type Note, type Tutor } from '../shared/models';

export type ExploreTab = 'notes' | 'tutors';

// Ported from src/app/(protected)/explore/page.tsx. Per Code Map: reads
// `tab` from ActivatedRoute.queryParamMap instead of useSearchParams()/
// Suspense (no SSR to work around in an Angular SPA). Per Never: Explore
// keeps local component state (not UiService/CAP-7) — paridad fiel with the
// MVP, which never wired its uiStore equivalent into this page either.
@Component({
  selector: 'app-explore-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    HeaderComponent,
    NavbarComponent,
    ButtonComponent,
    InputComponent,
    SkeletonComponent,
    EmptyStateComponent,
    NoteCardComponent,
    TutorCardComponent,
  ],
  templateUrl: './explore.page.html',
  styleUrl: './explore.page.scss',
})
export class ExplorePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly notesService = inject(NotesService);
  private readonly tutorsService = inject(TutorsService);

  readonly majorOptions = MAJOR_OPTIONS;
  readonly materialTypeEntries = Object.entries(MATERIAL_TYPE_LABELS) as [string, string][];

  readonly closeIcon = closeOutline;
  readonly filterIcon = funnelOutline;
  readonly bookIcon = bookOutline;
  readonly peopleIcon = peopleOutline;

  readonly activeTab = signal<ExploreTab>(
    this.route.snapshot.queryParamMap.get('tab') === 'tutors' ? 'tutors' : 'notes',
  );
  readonly searchQuery = signal('');
  readonly showFilters = signal(false);
  readonly major = signal('');
  readonly materialType = signal('');

  readonly notes = signal<Note[]>([]);
  readonly tutors = signal<Tutor[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3, 4];

  // I/O matrix: "Explore cambia de tab o filtro mientras carga" — ported
  // from the MVP's `let cancelled = false` closure-per-effect-run pattern as
  // a monotonically increasing request id: a fetch whose id no longer
  // matches `requestId` by the time it resolves is stale and its result is
  // discarded instead of applied.
  private requestId = 0;

  async ngOnInit(): Promise<void> {
    // AC: "Explore con ?tab=tutors ... el tab Clases queda activo sin
    // re-fetch de notas" — activeTab() already reflects the initial query
    // param, so this single fetch() only ever queries the active tab.
    await this.fetch();
  }

  setTab(tab: ExploreTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    void this.fetch();
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  onSearchChange(): void {
    void this.fetch();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    void this.fetch();
  }

  setMajor(major: string): void {
    this.major.set(major);
    void this.fetch();
  }

  toggleMaterialType(materialType: string): void {
    this.materialType.set(this.materialType() === materialType ? '' : materialType);
    void this.fetch();
  }

  tutorSubtitle(tutor: Tutor): string {
    const courses = tutor.courses?.map((c) => c.course_name).join(', ') || '';
    return `${tutor.user?.major ?? ''} · ${courses}`;
  }

  private async fetch(): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);

    if (this.activeTab() === 'notes') {
      const data = await this.notesService.search({
        query: this.searchQuery(),
        major: this.major(),
        materialType: this.materialType(),
      });
      if (id !== this.requestId) return; // stale — a newer fetch already started
      this.notes.set(data);
    } else {
      const data = await this.tutorsService.search({ query: this.searchQuery(), major: this.major() });
      if (id !== this.requestId) return;
      this.tutors.set(data);
    }

    this.loading.set(false);
  }
}
