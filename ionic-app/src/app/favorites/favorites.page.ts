import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { NoteCardComponent } from '../shared/ui/note-card/note-card.component';
import { TutorCardComponent } from '../shared/ui/tutor-card/tutor-card.component';

import { AuthService } from '../shared/state/auth.service';
import { FavoritesService } from '../shared/state/favorites.service';
import type { Favorite } from '../shared/models';

// Ported from src/app/(protected)/favorites/page.tsx. Read-only per Never
// (the favorite/unfavorite toggle lives in the note detail page, CAP-3, out
// of scope here).
@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [
    IonContent,
    HeaderComponent,
    NavbarComponent,
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    NoteCardComponent,
    TutorCardComponent,
  ],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.scss',
})
export class FavoritesPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);

  readonly favorites = signal<Favorite[]>([]);
  readonly loading = signal(true);

  readonly skeletonRows = [1, 2, 3];

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.favorites.set(await this.favoritesService.fetchAll(userId));
    this.loading.set(false);
  }

  // I/O matrix: "Favoritos vacío" — EmptyState's action button navigates to
  // /explore, ported via AppButtonComponent (Boundaries: replace the MVP's
  // raw <button> here specifically).
  goExplore(): void {
    void this.router.navigateByUrl('/explore');
  }

  // I/O matrix: "Favorito con note o tutor nulo" — the caller (this page),
  // not TutorCardComponent, computes the subtitle string per Design Notes;
  // Favoritos' tutor subtitle is just the major (no course info), matching
  // favorites/page.tsx líneas 92-94.
  tutorSubtitle(favorite: Favorite): string {
    return favorite.tutor?.user?.major ?? '';
  }
}
