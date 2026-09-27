import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { sparklesOutline } from 'ionicons/icons';
import type { AIDeclaration } from '../../models';
import { BadgeComponent } from '../badge/badge.component';

// Ported from src/components/shared/AIDeclaration.tsx (AIDeclarationBadge).
// Depends on the already-ported Badge component and the AIDeclaration type
// (per Code Map). lucide's Brain icon has no ionicons equivalent at all
// (ionicons ships no "brain" glyph) — substituted with sparkles-outline, a
// common "AI/generated" glyph in Ionic-based apps. Documented decision, not
// one of the 4 flagged Design Notes risks, but still a deliberate glyph swap.
@Component({
  selector: 'app-ai-declaration-badge',
  standalone: true,
  imports: [IonIcon, BadgeComponent],
  templateUrl: './ai-declaration-badge.component.html',
  styleUrl: './ai-declaration-badge.component.scss',
})
export class AiDeclarationBadgeComponent {
  readonly declaration = input.required<AIDeclaration>();
  readonly details = input<string | null>(null);

  readonly icon = sparklesOutline;
  readonly visible = computed(() => this.declaration() !== 'none');
  readonly label = computed(() =>
    this.declaration() === 'assisted' ? 'Asistido por IA' : 'Generado con IA'
  );
  readonly badgeVariant = computed(() => (this.declaration() === 'assisted' ? 'primary' : 'warning'));
  readonly badgeLabel = computed(() => (this.declaration() === 'assisted' ? 'Revisado' : 'Requiere revisión'));
}
