import { Component, computed, input } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular';

// Ported from src/components/ui/Button.tsx.
// Native ion-button (fill/color/size) instead of Tailwind classes; a plain
// (click) binding on <app-button> works because ion-button's native click
// event bubbles (composed) up through the host element.
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IonButton, IonSpinner],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly fill = computed<'solid' | 'outline' | 'clear'>(() => {
    if (this.variant() === 'outline') return 'outline';
    if (this.variant() === 'ghost') return 'clear';
    return 'solid';
  });

  readonly color = computed(() => {
    switch (this.variant()) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'outline':
        return 'primary';
      case 'ghost':
        return 'medium';
      case 'danger':
        return 'danger';
    }
  });

  readonly expand = computed(() => (this.fullWidth() ? 'block' : undefined));
  readonly isDisabled = computed(() => this.disabled() || this.loading());
}
