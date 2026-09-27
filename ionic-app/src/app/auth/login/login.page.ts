import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { AuthService } from '../../shared/state/auth.service';

type LoginMode = 'password' | 'magic';

interface DemoAccount {
  email: string;
  name: string;
}

// Ported from src/app/(auth)/login/page.tsx onto the CAP-7 UI kit.
// Never (Boundaries): the demo-accounts block is a known pre-production bug
// (known-issues.md #4) — it's ported verbatim, not fixed, per spec.
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'martina@udd.cl', name: 'Martina' },
  { email: 'benjamin@udd.cl', name: 'Benjamín' },
  { email: 'sofia@udd.cl', name: 'Sofía' },
  { email: 'tomas@udd.cl', name: 'Tomás' },
];

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [IonContent, ButtonComponent, CardComponent, InputComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly demoAccounts = DEMO_ACCOUNTS;

  readonly email = signal('');
  readonly password = signal('');
  readonly mode = signal<LoginMode>('password');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  setMode(mode: LoginMode): void {
    this.error.set('');
    this.mode.set(mode);
  }

  fillDemoAccount(account: DemoAccount): void {
    this.error.set('');
    this.email.set(account.email);
    this.password.set('test123456');
    this.mode.set('password');
  }

  useAnotherEmail(): void {
    this.success.set(false);
    this.email.set('');
  }

  async submit(): Promise<void> {
    if (this.loading()) return;

    this.error.set('');

    // I/O matrix: "Email no institucional" — never calls Supabase.
    if (!this.email().endsWith('@udd.cl')) {
      this.error.set('Solo se aceptan correos institucionales @udd.cl');
      return;
    }

    this.loading.set(true);

    if (this.mode() === 'password') {
      const { error } = await this.auth.signInWithPassword(this.email(), this.password());

      if (error) {
        // I/O matrix: "Password incorrecto" — normalized the same way as the
        // MVP (case-insensitive "invalid" check on the raw message).
        this.error.set(
          error.includes('invalid') || error.includes('Invalid') ? 'Correo o contraseña incorrectos' : error,
        );
        this.loading.set(false);
        return;
      }

      // protectedGuard reads auth.user() — without this, a successful
      // password login would navigate to a guarded route while the local
      // signal is still null, and bounce straight back to /login.
      // CAP-2: '/' (Home) replaces /kit as the real post-login destination.
      await this.auth.fetchUser();
      this.loading.set(false);
      await this.router.navigateByUrl('/');
      return;
    }

    const { error } = await this.auth.signInWithMagicLink(this.email());

    if (error) {
      this.error.set(error);
      this.loading.set(false);
      return;
    }

    // I/O matrix: "Magic link enviado" — success screen, no navigation.
    this.success.set(true);
    this.loading.set(false);
  }
}
