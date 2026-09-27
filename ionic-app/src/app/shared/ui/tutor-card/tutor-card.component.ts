import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardComponent } from '../card/card.component';
import { BadgeComponent } from '../badge/badge.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { VerifiedBadgeComponent } from '../verified-badge/verified-badge.component';
import type { Tutor } from '../../models';
import { formatCLP, getInitials } from '../../utils';

// CAP-2: shared by Home/Explore/Favorites — same 2-flag pattern as NoteCard
// (Design Notes). `subtitle` is passed in already formatted by the caller
// because its content/format differs per page (course vs. major, single vs.
// joined courses) — see Code Map, not worth unifying inside the component.
//
// Decision (documented, not silent): the Code Map only lists 2 boolean
// inputs (showModalities, showRating) — no separate flag for the verified
// badge / hourly price. The MVP's favorites/page.tsx tutor card renders
// neither the VerifiedBadge nor the rating/price row at all (favorites/page
// líneas 80-98), unlike Home/Explore which always show the verified check
// when `tutor.verified` is true. Rather than adding an undocumented 3rd
// input, `showRating=false` (already the Favorites variant per the other 2
// callers) also gates the verified badge here, since that's the one flag
// this component's Code Map surface actually exposes for "the secondary
// meta row".
@Component({
  selector: 'app-tutor-card',
  standalone: true,
  imports: [RouterLink, CardComponent, BadgeComponent, RatingStarsComponent, VerifiedBadgeComponent],
  templateUrl: './tutor-card.component.html',
  styleUrl: './tutor-card.component.scss',
})
export class TutorCardComponent {
  readonly tutor = input.required<Tutor>();
  readonly subtitle = input.required<string>();
  readonly showModalities = input(false);
  readonly showRating = input(true);

  readonly formatCLP = formatCLP;

  readonly initials = computed(() => getInitials(this.tutor().user?.full_name || 'TU'));
  readonly displayName = computed(() => this.tutor().user?.full_name || 'Tutor');
}
