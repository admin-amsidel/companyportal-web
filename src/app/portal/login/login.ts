/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { Component, inject, input, signal, effect, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../auth.service';
import { PortalStyles } from '../portal-styles';
import { apiProblem } from '../portal.models';
import { CREDITS } from '../../shared/credits';

/** Staff sign-in with user ID + PIN, opened from the landing page. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, MessageModule, PortalStyles],
  template: `
    <app-portal-styles />
    <main class="login">
      <section class="panel panel--brand">
        <a class="back" routerLink="/"><span aria-hidden="true">←</span> Company Portal home</a>
        <div class="brand">
          <img class="mark" src="brand/logo-mark.svg" alt="" width="64" height="64" />
          <p class="kicker">All-in-one business portal</p>
          <h1>Company Portal</h1>
          <p class="lede">People, operations, sales and customers, all in one place.</p>
        </div>
        <img class="art" src="images/hero-team.webp" alt="" width="1400" height="788" />
        <p class="foot">People · Operations · Sales · Customers</p>
      </section>

      <section class="panel panel--form">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h2>Sign in</h2>
          <p class="sub">Use the user ID and PIN given to you by your admin.</p>

          @if (reason() === 'expired') {
            <p-message severity="warn">Session expired. Please log in again.</p-message>
          } @else if (reason() === 'pin-changed') {
            <p-message severity="success">Your PIN was changed. Sign in with your new PIN.</p-message>
          }

          <div class="pf">
            <label for="l-user">User ID</label>
            <input pInputText id="l-user" formControlName="userId" autocomplete="username" autocapitalize="none"
                   spellcheck="false" [invalid]="show('userId')" />
            @if (show('userId')) { <small class="error">Enter your user ID.</small> }
          </div>

          <div class="pf">
            <label for="l-pin">PIN</label>
            <p-password inputId="l-pin" formControlName="password" [feedback]="false" [toggleMask]="true"
                        autocomplete="current-password" [invalid]="show('password')" [fluid]="true" />
            @if (show('password')) { <small class="error">Enter your PIN.</small> }
          </div>

          @if (error()) {
            <p-message severity="error">{{ error() }}</p-message>
          }

          <p-button type="submit" [label]="busy() ? 'Signing in…' : 'Sign in'" [loading]="busy()" [fluid]="true" />

          <p class="help">Forgot your PIN or locked out? Ask your admin to reset it.</p>
        </form>
        <p class="credit">{{ credits.copyright }} · {{ credits.line }}</p>
      </section>
    </main>
  `,
  styles: `
    .credit { margin: 24px 0 0; text-align: center; color: var(--muted); font-size: .75rem; }
    :host { display: block; background: var(--bg); }
    .login { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); }
    .panel { padding: 40px clamp(20px, 5vw, 64px); display: flex; flex-direction: column; }
    .panel--brand {
      position: relative; overflow: hidden; color: #fff; justify-content: space-between; gap: 28px;
      background:
        radial-gradient(90% 60% at 100% 100%, rgba(56, 189, 248, .45), transparent 60%),
        radial-gradient(80% 60% at 0% 0%, rgba(251, 146, 60, .35), transparent 55%),
        linear-gradient(150deg, #7c3aed 0%, #5b3df5 45%, #3730a3 100%);
    }
    .back { color: #e4dcff; text-decoration: none; font-size: .85rem; letter-spacing: .08em; align-self: flex-start; }
    .back:hover { color: #fff; }
    .brand .mark { width: 64px; height: 64px; margin-bottom: 22px; padding: 10px; border-radius: 18px; background: #fff;
      box-shadow: 0 12px 30px -10px rgba(20, 10, 80, .55); }
    .brand .kicker { color: #fde68a; }
    h1 { font-size: clamp(2.2rem, 4.5vw, 3.2rem); color: #fff; font-weight: 800; }
    .lede { color: #ede9fe; max-width: 34ch; margin: 14px 0 0; }
    .art { width: 100%; max-width: 520px; height: auto; align-self: center; border-radius: 22px; background: #fff;
      box-shadow: 0 30px 60px -30px rgba(20, 10, 80, .7); }
    .foot { margin: 0; font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: #d6ccff; }
    .panel--form { justify-content: center; align-items: center; }
    form { width: 100%; max-width: 380px; display: grid; gap: 18px; }
    h2 { font-size: 2rem; }
    .sub { margin: -10px 0 6px; color: var(--muted); font-size: .95rem; }
    .help { margin: 0; font-size: .85rem; color: var(--muted); text-align: center; }
    @media (max-width: 820px) {
      .login { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .panel--brand { padding-block: 20px 28px; gap: 18px; }
      .brand .mark { width: 52px; height: 52px; padding: 8px; margin-bottom: 14px; }
      .lede, .foot, .art { display: none; }
      .panel--form { justify-content: flex-start; padding-top: 32px; }
    }
  `,
})
export class Login {
  protected readonly credits = CREDITS;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query params (?next=/portal/...&reason=expired), bound by withComponentInputBinding. */
  readonly next = input<string>();
  readonly reason = input<string>();
  /** ?user= : the user ID to fill in (after a PIN change). */
  readonly user = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');

  constructor() {
    // after a PIN change: the user ID is filled in, the new PIN is typed
    effect(() => {
      const u = this.user();
      if (u) untracked(() => this.form.controls.userId.setValue(u));
    });
  }

  protected show(name: 'userId' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;

    this.busy.set(true);
    const { userId, password } = this.form.getRawValue();
    this.auth.login(userId.trim(), password).subscribe({
      next: (user) => {
        // only return to portal pages, never to an address passed in from outside
        const back = this.next()?.startsWith('/portal') ? this.next()! : '/portal';
        this.router.navigateByUrl(user.mustChangePassword ? '/portal/change-pin' : back);
      },
      error: (err) => {
        this.error.set(apiProblem(err).message);
        this.form.controls.password.reset();
        this.busy.set(false);
      },
    });
  }
}
