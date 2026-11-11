/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRODUCT, salesMailto, telHref } from '../../data/product.config';
import { PRODUCT_MODULES } from '../../data/product-modules';
import { AuthService } from '../../portal/auth.service';
import { CREDITS } from '../../shared/credits';
import { Icon, IconName } from './icon';
import { SupportChat } from './support-chat';

interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

/**
 * Company Portal's public page: what the product does and why it helps. Existing customers sign in through "Login to
 * Portal" (the /login page); prospects ask the support chat about features and pricing, or for a call back or a demo.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, Icon, SupportChat],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly product = PRODUCT;
  protected readonly credits = CREDITS;
  protected readonly year = new Date().getFullYear();
  protected readonly demoHref = salesMailto(
    `${PRODUCT.name} demo request`,
    'Hello,\n\nWe would like a demo of Company Portal.\n\nCompany:\nNumber of employees:\nModules we are interested in:\nPhone:\n',
  );
  protected readonly salesHref = salesMailto(`${PRODUCT.name} enquiry`);
  protected readonly phoneHref = PRODUCT.phone ? telHref(PRODUCT.phone) : '';

  /** Signed in already: "Login to Portal" becomes "Open Portal". */
  protected readonly auth = inject(AuthService);

  protected readonly menuOpen = signal(false);

  /** The eight modules in the strip under the hero (and in more detail further down). */
  protected readonly modules = PRODUCT_MODULES;

  /** The four benefits on the coloured wave. */
  protected readonly benefits: Feature[] = [
    { icon: 'rocket', title: 'Improve Productivity', text: 'Streamline daily operations' },
    { icon: 'shield', title: 'Centralized & Secure', text: 'Your business data, always protected' },
    { icon: 'layers', title: 'Integrated Operations', text: 'People, products, sales & customers in sync' },
    { icon: 'insights', title: 'Business Insights', text: 'Track performance and grow faster' },
  ];

  /** Everything else that comes with it. */
  protected readonly extras: Feature[] = [
    { icon: 'building', title: 'Multi-brand ready', text: 'Run several companies or brands from one portal, each with its own logo, colours, mail and work rules.' },
    { icon: 'key', title: 'Menu-level access', text: 'Decide which menus every role, designation or person sees. Every API checks it too.' },
    { icon: 'chat', title: 'Team chat & news', text: 'Conversations, a company news board and meeting calendar keep everyone in the loop.' },
    { icon: 'mail', title: 'Staff & customer mail', text: 'Send designed mails to staff, customers and suppliers straight from the portal.' },
    { icon: 'bell', title: 'Notifications', text: 'Meeting reminders, approvals waiting and leave-plan alerts as they happen.' },
    { icon: 'phone', title: 'Works on every phone', text: 'Built mobile-first: check in, apply for leave or scan stock from any browser.' },
  ];

  protected readonly steps: Feature[] = [
    { icon: 'building', title: 'Set up your company', text: 'Add your brands, designations and the menus each role can open. We help you import your people.' },
    { icon: 'users', title: 'Invite your team', text: 'Every employee gets a user ID and a PIN. They change it on first sign-in, and you are live.' },
    { icon: 'insights', title: 'Run everything in one place', text: 'Attendance, leave, payroll, stock, sales and customers — all connected, all on one dashboard.' },
  ];

  protected readonly stats = [
    { value: '8', label: 'core modules' },
    { value: '40+', label: 'built-in screens' },
    { value: '4', label: 'role levels' },
    { value: '100%', label: 'browser based' },
  ];

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
