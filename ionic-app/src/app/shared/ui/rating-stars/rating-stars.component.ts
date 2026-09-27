import { Component, computed, input, model } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { star, starHalf, starOutline } from 'ionicons/icons';

// Ported from src/components/shared/RatingStars.tsx. Per Code Map: no direct
// ion-* equivalent exists for this, so it stays custom — lucide's Star icon
// is swapped for ionicons' star/star-half/star-outline (the lucide→ionicons
// substitution the spec explicitly calls out for this component).
export type RatingStarsSize = 'sm' | 'md' | 'lg';

interface StarState {
  index: number;
  icon: string;
  filled: boolean;
}

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.scss',
})
export class RatingStarsComponent {
  readonly rating = model<number>(0);
  readonly maxRating = input(5);
  readonly size = input<RatingStarsSize>('sm');
  readonly showValue = input(true);
  readonly showCount = input(false);
  readonly count = input<number | undefined>(undefined);
  readonly interactive = input(false);

  private readonly pxSize: Record<RatingStarsSize, number> = { sm: 14, md: 18, lg: 24 };

  readonly iconPx = computed(() => this.pxSize[this.size()]);

  readonly stars = computed<StarState[]>(() => {
    const rating = this.rating();
    const max = this.maxRating();
    return Array.from({ length: max }, (_, i) => {
      const filled = i < Math.floor(rating);
      const halfFilled = !filled && i < rating;
      return {
        index: i,
        filled,
        icon: filled ? star : halfFilled ? starHalf : starOutline,
      };
    });
  });

  onStarClick(index: number): void {
    if (!this.interactive()) return;
    this.rating.set(index + 1);
  }
}
