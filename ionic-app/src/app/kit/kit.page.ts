import { Component, computed, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';

import { ButtonComponent, type ButtonVariant } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { InputComponent } from '../shared/ui/input/input.component';
import { BadgeComponent, type BadgeVariant } from '../shared/ui/badge/badge.component';
import { SkeletonComponent } from '../shared/ui/skeleton/skeleton.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { RatingStarsComponent } from '../shared/ui/rating-stars/rating-stars.component';
import { VerifiedBadgeComponent } from '../shared/ui/verified-badge/verified-badge.component';
import { AiDeclarationBadgeComponent } from '../shared/ui/ai-declaration-badge/ai-declaration-badge.component';
import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';

import { AuthService } from '../shared/state/auth.service';
import { CartService } from '../shared/state/cart.service';
import { UiService } from '../shared/state/ui.service';
import { formatCLP } from '../shared/utils';
import type { AIDeclaration } from '../shared/models';

// Route `/kit`: the only screen this spec creates (per Boundaries &
// Constraints — no domain screens). Instantiates every ported component in
// its main variants and reads/writes each ported service, so the whole kit
// can be checked visually in one place per the Acceptance Criteria.
@Component({
  selector: 'app-kit-page',
  standalone: true,
  imports: [
    IonContent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    BadgeComponent,
    SkeletonComponent,
    ToastComponent,
    EmptyStateComponent,
    RatingStarsComponent,
    VerifiedBadgeComponent,
    AiDeclarationBadgeComponent,
    HeaderComponent,
    NavbarComponent,
  ],
  templateUrl: './kit.page.html',
  styleUrl: './kit.page.scss',
})
export class KitPage {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly ui = inject(UiService);

  // --- Button ---
  readonly buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
  readonly buttonLoading = signal(false);

  // --- Badge ---
  readonly badgeVariants: BadgeVariant[] = ['default', 'primary', 'success', 'warning', 'error', 'gold'];

  // --- Input ---
  readonly inputValue = signal('');
  readonly inputWithHint = signal('');
  readonly inputWithError = signal('no-valido');

  // --- UiService demo (a local draft signal + explicit ngModel form,
  // synced into the service on change) ---
  readonly searchDraft = signal('');

  // --- Toast (Design Notes risk #2: positioning) ---
  readonly toastOpenAnchored = signal(false);
  readonly toastOpenBare = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('Guardado con éxito');
  readonly navbarAnchorId = 'app-navbar-el';

  // --- RatingStars — I/O matrix: rating=3.5 → 3 llenas, 1 media, 1 vacía ---
  readonly demoRating = signal(3.5);
  readonly interactiveRating = signal(2);

  // --- AI declaration ---
  readonly aiDeclarations: AIDeclaration[] = ['assisted', 'generated'];

  // --- CartService demo (I/O matrix: items() vacío → total() === 0) ---
  readonly cartEmptyTotal = computed(() => this.cart.total());
  readonly formatCLP = formatCLP;

  showToast(type: ToastType, message: string, anchored: boolean): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    // Close the other demo toast first so triggering "anclado" then "sin
    // anclar" (or vice versa) within the same 3s window can't leave both open.
    this.toastOpenAnchored.set(anchored);
    this.toastOpenBare.set(!anchored);
  }

  addSampleCartItem(): void {
    this.cart.addItem({
      id: crypto.randomUUID(),
      type: 'note',
      title: 'Resumen de Cálculo II',
      price: 3500,
    });
  }

  toggleLoading(): void {
    this.buttonLoading.set(!this.buttonLoading());
  }

  fetchAuthUser(): void {
    void this.auth.fetchUser();
  }
}
