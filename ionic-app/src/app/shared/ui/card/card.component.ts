import { Component, input } from '@angular/core';
import { IonCard } from '@ionic/angular';

// Ported from src/components/ui/Card.tsx. The original is a single flat
// <div> (no separate header/content split), so this wraps ion-card directly
// and puts padding on the ion-card host itself rather than nesting
// ion-card-content — closer 1:1 with the original single-node structure.
//
// Design Notes flagged Card's radius/shadow as a parity risk: Ionic's own
// --border-radius/--box-shadow defaults do NOT match rounded-2xl (16px) +
// shadow-sm/shadow-md. Resolved here exactly as the note prescribes ("ajustar
// por variable, no asumir que el default de Ionic coincide") using the same
// Tailwind shadow formulas as globals.css. Flagged for Lucas's visual check.
export type CardVariant = 'default' | 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [IonCard],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
}
