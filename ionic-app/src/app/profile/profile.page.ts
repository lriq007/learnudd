import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import {
  bookOutline,
  cardOutline,
  chevronForwardOutline,
  heartOutline,
  helpCircleOutline,
  logOutOutline,
  starOutline,
} from 'ionicons/icons';

import { HeaderComponent } from '../shared/layout/header/header.component';
import { NavbarComponent } from '../shared/layout/navbar/navbar.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { CardComponent } from '../shared/ui/card/card.component';
import { InputComponent } from '../shared/ui/input/input.component';
import { VerifiedBadgeComponent } from '../shared/ui/verified-badge/verified-badge.component';
import { ToastComponent, type ToastType } from '../shared/ui/toast/toast.component';

import { AuthService } from '../shared/state/auth.service';
import { SupabaseService } from '../shared/state/supabase.service';
import { getInitials } from '../shared/utils';

interface ProfileMenuItem {
  icon: string;
  label: string;
  href: string;
  colorClass: string;
}

interface ProfileStats {
  library: number;
  favorites: number;
  notesPublished: number;
}

// Ported 1:1 from src/app/(protected)/profile/page.tsx, minus the "Modo
// creador" card (linked to /profile/creator in the MVP) — that dashboard is
// out of scope per Boundaries/Never (see deferred-work.md), so it isn't
// ported here either; Approach only lists user data + 3 stats + the 5-item
// menu + logout.
//
// Decision (human, 2026-09-27, documented in Intent): the MVP is read-only,
// but this page adds inline editing of full_name/major via
// AuthService.updateProfile() — new functionality relative to the MVP,
// deliberate. email/campus/avatar_url/verified stay read-only always (Never).
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    HeaderComponent,
    NavbarComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    VerifiedBadgeComponent,
    ToastComponent,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly getInitials = getInitials;

  readonly stats = signal<ProfileStats>({ library: 0, favorites: 0, notesPublished: 0 });

  readonly editing = signal(false);
  readonly fullNameDraft = signal('');
  readonly majorDraft = signal('');
  readonly loading = signal(false);

  readonly toastOpen = signal(false);
  readonly toastType = signal<ToastType>('info');
  readonly toastMessage = signal('');

  // Toast sits above the fixed Navbar, same pattern as kit.page.ts
  // (navbarAnchorId) — this page renders <app-navbar>, unlike
  // publish-tutor.page.ts (a pushed page with no tab bar).
  readonly navbarAnchorId = 'app-navbar-el';

  readonly chevronIcon = chevronForwardOutline;
  readonly logOutIcon = logOutOutline;

  // Ported from profile/page.tsx's menuItems (líneas 52-83): same 5 entries,
  // same order, same dead-link ('#') entries for payment methods/help (Never).
  readonly menuItems: ProfileMenuItem[] = [
    { icon: bookOutline, label: 'Mi biblioteca', href: '/library', colorClass: 'profile-menu__icon--blue' },
    { icon: heartOutline, label: 'Favoritos', href: '/favorites', colorClass: 'profile-menu__icon--red' },
    { icon: starOutline, label: 'Mis reservas', href: '/bookings', colorClass: 'profile-menu__icon--gold' },
    { icon: cardOutline, label: 'Métodos de pago', href: '#', colorClass: 'profile-menu__icon--sky' },
    { icon: helpCircleOutline, label: 'Ayuda', href: '#', colorClass: 'profile-menu__icon--gray' },
  ];

  // Frozen validation (Boundaries): "Guardar" disabled if either field is
  // empty after .trim().
  readonly canSave = computed(() => !!this.fullNameDraft().trim() && !!this.majorDraft().trim());

  // Counts loaded in parallel (Promise.all), ported from profile/page.tsx's
  // fetchStats (líneas 35-47). Per Never: no explicit network error handling
  // — a null client or a rejected/erroring query both fall through to the
  // same `.count || 0` a failed MVP query would show.
  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    const client = this.supabaseService.client;
    if (!userId || !client) return;

    const [library, favorites, notes] = await Promise.all([
      client.from('library').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('notes').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    ]);

    this.stats.set({
      library: library.count || 0,
      favorites: favorites.count || 0,
      notesPublished: notes.count || 0,
    });
  }

  startEditing(): void {
    this.fullNameDraft.set(this.user()?.full_name ?? '');
    this.majorDraft.set(this.user()?.major ?? '');
    this.editing.set(true);
  }

  // Per Boundaries: discards the drafts without calling updateProfile().
  cancelEditing(): void {
    this.editing.set(false);
  }

  async saveProfile(): Promise<void> {
    if (!this.canSave()) return;

    this.loading.set(true);
    const { error } = await this.auth.updateProfile({
      full_name: this.fullNameDraft().trim(),
      major: this.majorDraft().trim(),
    });

    if (error) {
      this.showToast('error', error);
    } else {
      this.showToast('success', 'Perfil actualizado');
      this.editing.set(false);
    }

    this.loading.set(false);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  private showToast(type: ToastType, message: string): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }
}
