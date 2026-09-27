import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { bookOutline, documentTextOutline } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';

import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import type { LibraryItem } from '../shared/models';
import { formatDate } from '../shared/utils';

export type LibraryTab = 'all' | 'notes' | 'saved';

// Ported 1:1 from src/app/(protected)/library/page.tsx. Per Never: the tabs
// (Todos/Apuntes/Guardados) are UI-only — the MVP itself never implements
// the filter (`// TODO: implement filtering by tab`), so `filteredItems`
// here is the same always-true pass-through, not a real filter.
@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    HeaderComponent,
    NavbarComponent,
    ButtonComponent,
    CardComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './library.page.html',
  styleUrl: './library.page.scss',
})
export class LibraryPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notesService = inject(NotesService);
  private readonly router = inject(Router);

  readonly bookIcon = bookOutline;
  readonly openIcon = documentTextOutline;
  readonly formatDate = formatDate;

  readonly tabs: LibraryTab[] = ['all', 'notes', 'saved'];
  readonly activeTab = signal<LibraryTab>('all');
  readonly items = signal<LibraryItem[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3];

  // Per Never: no real filtering by tab — same always-true pass-through as
  // the MVP's `.filter(() => true)`.
  readonly filteredItems = computed(() => this.items());

  readonly tabLabels: Record<LibraryTab, string> = {
    all: 'Todos',
    notes: 'Apuntes',
    saved: 'Guardados',
  };

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.items.set(await this.notesService.listPurchased(userId));
    this.loading.set(false);
  }

  setTab(tab: LibraryTab): void {
    this.activeTab.set(tab);
  }

  // I/O matrix: "Biblioteca vacía" — EmptyState's action button navigates to
  // /explore.
  goExplore(): void {
    void this.router.navigateByUrl('/explore');
  }
}
