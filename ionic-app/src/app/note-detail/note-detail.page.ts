import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { cartOutline, checkmarkCircleOutline, documentTextOutline, heart, heartOutline, star } from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { BadgeComponent } from '../shared/ui/badge/badge.component';
import { RatingStarsComponent } from '../shared/ui/rating-stars/rating-stars.component';
import { VerifiedBadgeComponent } from '../shared/ui/verified-badge/verified-badge.component';
import { AiDeclarationBadgeComponent } from '../shared/ui/ai-declaration-badge/ai-declaration-badge.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';

import { AuthService } from '../shared/state/auth.service';
import { NotesService } from '../shared/state/notes.service';
import { FavoritesService } from '../shared/state/favorites.service';
import { MATERIAL_TYPE_LABELS, type MaterialType, type Note, type NoteRating } from '../shared/models';
import { formatCLP, getInitials } from '../shared/utils';

// Ported 1:1 from src/app/(protected)/explore/notes/[id]/page.tsx. Per Code
// Map: no EmptyStateComponent — the MVP's "no encontrado" state is a plain
// centered paragraph, not the EmptyState pattern (which always ships an
// action button/CTA this state never had).
@Component({
  selector: 'app-note-detail-page',
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
    AiDeclarationBadgeComponent,
    SkeletonComponent,
    ToastComponent,
  ],
  templateUrl: './note-detail.page.html',
  styleUrl: './note-detail.page.scss',
})
export class NoteDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly notesService = inject(NotesService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly destroyRef = inject(DestroyRef);

  // Review fix (route-reactivity gap): Angular's default route reuse
  // strategy keeps this component instance alive across navigations that
  // only change this route's `:id` param, so a one-time `snapshot` read
  // (the original port of the MVP's `useEffect(..., [params.id])`) never
  // refetches on a second such navigation. `currentId` de-dupes the
  // subscription's own initial (synchronous) emission against the explicit
  // first load below, so only a *later*, different id triggers a refetch.
  private currentId: string | null = null;

  readonly cartIcon = cartOutline;
  readonly verifiedIcon = checkmarkCircleOutline;
  readonly documentIcon = documentTextOutline;
  readonly starIcon = star;
  readonly heartIcon = heart;
  readonly heartOutlineIcon = heartOutline;

  readonly note = signal<Note | null>(null);
  readonly ratings = signal<NoteRating[]>([]);
  readonly loading = signal(true);
  readonly purchasing = signal(false);
  readonly isFavorite = signal(false);

  readonly toastOpen = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('');

  readonly formatCLP = formatCLP;
  readonly getInitials = getInitials;

  readonly headerTitle = computed(() => {
    if (this.loading()) return 'Detalle';
    if (!this.note()) return 'No encontrado';
    return 'Detalle del apunte';
  });

  readonly materialTypeLabel = computed(() => {
    const note = this.note();
    return note ? MATERIAL_TYPE_LABELS[note.material_type as MaterialType] : '';
  });

  readonly authorInitials = computed(() => getInitials(this.note()?.author?.full_name || 'AU'));

  readonly buyLabel = computed(() => {
    const note = this.note();
    return note && note.price > 0 ? `Comprar por ${formatCLP(note.price)}` : 'Descargar gratis';
  });

  readonly visibleRatings = computed(() => this.ratings().slice(0, 5));

  readonly favoriteLabel = computed(() => (this.isFavorite() ? 'Quitar de favoritos' : 'Marcar como favorito'));

  async ngOnInit(): Promise<void> {
    const initialId = this.route.snapshot.paramMap.get('id');
    this.currentId = initialId;

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id === this.currentId) return;
      this.currentId = id;
      void this.loadNote(id);
    });

    await this.loadNote(initialId);
  }

  private async loadNote(id: string | null): Promise<void> {
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const noteData = await this.notesService.getById(id);
    this.note.set(noteData);

    if (noteData) {
      this.ratings.set(await this.notesService.getRatings(id));

      const userId = this.auth.user()?.id;
      if (userId) {
        this.isFavorite.set(await this.favoritesService.checkFavorite(userId, id));
      }
    } else {
      this.ratings.set([]);
      this.isFavorite.set(false);
    }

    this.loading.set(false);
  }

  async handlePurchase(): Promise<void> {
    const note = this.note();
    const userId = this.auth.user()?.id;
    if (!note || !userId) return;

    this.purchasing.set(true);

    const { error } = await this.notesService.purchase(userId, note);

    if (error) {
      this.showToast('error', error);
    } else {
      this.showToast('success', '¡El apunte ya es tuyo!');
    }

    this.purchasing.set(false);
  }

  // I/O matrix: "Toggle favorito en detalle" — optimistic, no error handling
  // (Never), same as the MVP.
  async toggleFavorite(): Promise<void> {
    const note = this.note();
    const userId = this.auth.user()?.id;
    if (!note || !userId) return;

    const wasFavorite = this.isFavorite();
    this.isFavorite.set(!wasFavorite);
    await this.favoritesService.toggle(userId, note.id, wasFavorite);
  }

  private showToast(type: ToastType, message: string): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
