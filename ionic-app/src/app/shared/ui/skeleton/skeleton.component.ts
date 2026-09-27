import { Component, input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

// Ported from src/components/ui/Skeleton.tsx onto ion-skeleton-text
// (flagged in Design Notes as a shimmer-parity risk).
//
// Inspected Ionic's actual shimmer (node_modules/@ionic/core .../skeleton-text.css):
// animation-duration: 1s (original: 1.5s), gradient stops driven by
// --background-rgb at 6.5%/13.5% alpha (original: opaque #f0f0f0/#e0e0e0
// linear-gradient), background-size 800px 104px fixed (original: 200% 100%,
// i.e. scales with element width), timing-function linear (original: default
// ease). Setting --background-rgb: 0,0,0 reproduces the target grays almost
// exactly (0/6.5% ≈ #eeeeee vs #f0f0f0; 0/13.5% ≈ #dcdcdc vs #e0e0e0), and
// --border-radius is set to the original's 8px. The animation SPEED and the
// fixed-vs-relative background-size are real, unresolved differences that
// Ionic's public CSS custom properties can't close without abandoning the
// native ion-skeleton-text shimmer for a fully custom one — flagged for
// Lucas to view at /kit and confirm before accepting as-is.
export type SkeletonWidth = string;

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  readonly width = input<SkeletonWidth>('100%');
  readonly height = input<SkeletonWidth>('1rem');
}
