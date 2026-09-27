import { Component, computed, input } from '@angular/core';
import { IonBadge } from '@ionic/angular';

// Ported from src/components/ui/Badge.tsx onto ion-badge.
// Note: ion-badge's own default look is a solid, high-contrast counter pill —
// nothing like the original's soft "10%-tint background + colored text"
// style, and this pairing isn't one of the 4 points already flagged in
// Design Notes. Resolved the same way as Card (CSS vars, not the Ionic
// default) to keep the tint look; flagging it in the report for confirmation
// since it's still a visual-parity call the frozen spec asks not to make silently.
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gold';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [IonBadge],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('sm');

  readonly classes = computed(() => `app-badge app-badge--${this.variant()} app-badge--${this.size()}`);
}
