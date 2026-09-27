import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { checkmarkCircleOutline, shieldOutline } from 'ionicons/icons';

// Ported from src/components/shared/VerifiedBadge.tsx. lucide Shield/CheckCircle
// (outline-style by default) swapped for ionicons shield-outline/checkmark-circle-outline
// to keep the same outline visual language.
export type VerifiedBadgeType = 'identity' | 'content';
export type VerifiedBadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-verified-badge',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './verified-badge.component.html',
  styleUrl: './verified-badge.component.scss',
})
export class VerifiedBadgeComponent {
  readonly type = input<VerifiedBadgeType>('identity');
  readonly size = input<VerifiedBadgeSize>('sm');

  readonly icon = computed(() => (this.type() === 'identity' ? shieldOutline : checkmarkCircleOutline));
  readonly label = computed(() => (this.type() === 'identity' ? 'UDD verificado' : 'Contenido verificado'));
  readonly iconPx = computed(() => (this.size() === 'sm' ? 12 : 14));
}
