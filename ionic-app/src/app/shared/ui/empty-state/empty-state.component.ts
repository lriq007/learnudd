import { Component, input } from '@angular/core';

// Ported from src/components/shared/EmptyState.tsx. No direct ion-*
// equivalent (Code Map doesn't call for one); icon/action are content
// projection slots (Angular's equivalent of React's ReactNode props).
// `icon` boolean input replaces React's "render circle wrapper only if an
// icon node was passed" check — Angular has no cheap way to detect whether
// content was projected into a slot, so the wrapper's presence is now an
// explicit flag instead of inferred from children (documented API adaptation,
// not a visual-risk item).
@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input(true);
}
