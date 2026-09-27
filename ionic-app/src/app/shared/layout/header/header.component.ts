import { Location } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonHeader, IonIcon, IonToolbar } from '@ionic/angular';
import { arrowBackOutline, cartOutline, notificationsOutline, searchOutline } from 'ionicons/icons';

// Ported from src/components/layout/Header.tsx onto ion-header/ion-toolbar
// (per Code Map). Inner layout stays a custom flex row (like Card/EmptyState)
// rather than ion-title/ion-buttons, to keep the original's exact
// left/right flex structure 1:1 instead of fighting Ionic toolbar's own
// title-centering assumptions.
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonIcon, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly location = inject(Location);

  readonly title = input<string>();
  readonly showBack = input(false);
  readonly showSearch = input(false);
  readonly showNotifications = input(true);
  readonly showCart = input(false);
  readonly searchClick = output<void>();

  readonly arrowBackIcon = arrowBackOutline;
  readonly searchIcon = searchOutline;
  readonly notificationsIcon = notificationsOutline;
  readonly cartIcon = cartOutline;

  goBack(): void {
    this.location.back();
  }
}
