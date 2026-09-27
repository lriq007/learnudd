import { Component, computed, input, model } from '@angular/core';
import { IonToast } from '@ionic/angular';
import { closeOutline } from 'ionicons/icons';

// Ported from src/components/ui/Toast.tsx onto the real ion-toast overlay
// (flagged in Design Notes as a positioning-parity risk).
//
// The original is fixed at `bottom-24` (96px up), centered, to clear the
// fixed Navbar (h-16 = 64px + safe-area). ion-toast has no public "distance
// from the edge" CSS variable (only --start/--end for horizontal inset) —
// its real, documented mechanism for "sit above the tab bar" is the
// `positionAnchor` prop (anchors the toast above a given element instead of
// a hardcoded pixel offset). That is what this component uses: consumers
// that have a Navbar/tab-bar on screen pass its element/id as
// `positionAnchor` and the toast sits flush above it; without one, ion-toast
// sits at the bottom edge (respecting safe-area) instead of 96px up.
// This is a real, deliberate difference from the hardcoded `bottom-24` and
// is flagged for Lucas's visual confirmation at /kit (rendered there both
// anchored to the ported Navbar and, for comparison, unanchored).
//
// Manual-close-cancels-the-timer (I/O matrix) is native ion-toast behavior:
// `dismiss()` — called on timeout OR via the built-in cancel button —
// always clears the pending duration timeout internally, so no custom timer
// code is needed here.
export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IonToast],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly isOpen = model(false);
  readonly message = input.required<string>();
  readonly type = input<ToastType>('info');
  readonly duration = input(3000);
  readonly positionAnchor = input<string | HTMLElement | undefined>(undefined);

  readonly closeIcon = closeOutline;

  readonly color = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
    }
  });

  readonly closeButtons = computed(() => [
    {
      icon: this.closeIcon,
      side: 'end' as const,
      role: 'cancel' as const,
    },
  ]);

  onDidDismiss(): void {
    this.isOpen.set(false);
  }
}
