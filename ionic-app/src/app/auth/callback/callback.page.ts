import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular';

import { AuthService } from '../../shared/state/auth.service';

// Ported from src/app/(auth)/callback/page.tsx. Per Code Map: exchange the
// code first; on failure go straight to /login?error=auth_failed without
// ever calling fetchUser(). On success, fetchUser() already brings the full
// profile (including onboarding_completed) via select('*'), so no extra
// query is needed here (unlike the MVP, which does a second one-column
// query just for onboarding_completed).
@Component({
  selector: 'app-callback-page',
  standalone: true,
  imports: [IonContent, IonSpinner],
  templateUrl: './callback.page.html',
  styleUrl: './callback.page.scss',
})
export class CallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    // @supabase/auth-js's exchangeCodeForSession(authCode) expects the bare
    // `code` value, not the raw query string -- extract it here.
    const code = new URLSearchParams(window.location.search).get('code') ?? '';

    // I/O matrix: "Callback exchange falla".
    const { error } = await this.auth.exchangeCodeForSession(code);

    if (error) {
      await this.router.navigateByUrl('/login?error=auth_failed');
      return;
    }

    await this.auth.fetchUser();
    const user = this.auth.user();

    // I/O matrix: "Callback sin sesión" — redirect to /login with no query param.
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }

    if (!user.onboarding_completed) {
      await this.router.navigateByUrl('/onboarding');
      return;
    }

    await this.router.navigateByUrl('/kit');
  }
}
