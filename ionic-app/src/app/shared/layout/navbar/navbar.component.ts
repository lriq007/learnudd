import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonIcon, IonTabBar, IonTabButton, IonLabel } from '@ionic/angular';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  addOutline,
  chatbubbleOutline,
  homeOutline,
  personOutline,
  searchOutline,
} from 'ionicons/icons';

// Ported from src/components/layout/Navbar.tsx.
//
// *** Design Notes' #1 flagged risk (highest visual-parity risk in CAP-7) ***
// ion-tab-bar's host has `contain: strict` (see node_modules/@ionic/core
// .../tab-bar/tab-bar.css), which clips anything a child tries to render
// outside the bar's own box — so the elevated/circular center button CANNOT
// be a normal ion-tab-button poking above the bar; it would just get cut
// off. Resolved per the note's own suggestion ("un botón flotante
// superpuesto"): the ion-tab-bar renders only the 4 real destinations plus
// an inert flex spacer in the middle slot, and the circular "Publicar"
// button is a separate absolutely-positioned sibling overlaid on top,
// anchored to the same bottom edge and given the same box height as the
// bar — which reproduces the ORIGINAL's exact flex-centering + `-mt-4` math
// (see navbar.component.scss), just escaping the tab-bar's containment
// instead of living inside it. Flagged for Lucas's visual confirmation.
interface NavItem {
  href: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { href: '/', icon: homeOutline, label: 'Inicio' },
    { href: '/explore', icon: searchOutline, label: 'Explorar' },
    { href: '/messages', icon: chatbubbleOutline, label: 'Mensajes' },
    { href: '/profile', icon: personOutline, label: 'Perfil' },
  ];

  readonly addIcon = addOutline;
  readonly publishHref = '/publish';

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  isActive(href: string): boolean {
    const url = this.currentUrl();
    return href === '/' ? url === '/' : url.startsWith(href);
  }
}
