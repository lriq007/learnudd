import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { bookOutline } from 'ionicons/icons';

import { CardComponent } from '../card/card.component';
import { BadgeComponent } from '../badge/badge.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { MATERIAL_TYPE_LABELS, type MaterialType, type Note } from '../../models';
import { formatCLP } from '../../utils';

// CAP-2: shared by Home/Explore/Favorites — Design Notes: the 3 usages of a
// note card differ only in 2 booleans plus a `variant` for Home's "Mejor
// evaluados" strip (compact) vs. every other list usage:
//   Home-lista:      showMaterialBadge=false, showRating=true,  variant=list
//   Home-compact:     ("Mejor evaluados")                        variant=compact
//   Explore-lista:    showMaterialBadge=true,  showRating=true,  variant=list
//   Favoritos-lista:  showMaterialBadge=false, showRating=false, variant=list
export type NoteCardVariant = 'list' | 'compact';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [RouterLink, IonIcon, CardComponent, BadgeComponent, RatingStarsComponent],
  templateUrl: './note-card.component.html',
  styleUrl: './note-card.component.scss',
})
export class NoteCardComponent {
  readonly note = input.required<Note>();
  readonly variant = input<NoteCardVariant>('list');
  readonly showMaterialBadge = input(false);
  readonly showRating = input(true);

  readonly bookIcon = bookOutline;
  readonly formatCLP = formatCLP;

  readonly materialTypeLabel = computed(() => MATERIAL_TYPE_LABELS[this.note().material_type as MaterialType]);
  readonly authorName = computed(() => this.note().author?.full_name || 'Autor');
  readonly isFree = computed(() => this.note().price === 0);
}
