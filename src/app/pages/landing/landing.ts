/*
 * Copyright (c) 2026 AMSIDEL Technologies. All rights reserved.
 * Designed and developed by AMSIDEL Technologies.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PRODUCT, salesMailto, telHref } from '../../data/product.config';
import { AuthService } from '../../portal/auth.service';
import { apiProblem } from '../../portal/portal.models';
import { CREDITS } from '../../shared/credits';
import { Icon, IconName } from './icon';

interface Module {
  icon: IconName;
  /** colour of the icon tile, see .tone--* in landing.scss */
  tone: string;
  title: string;
  short: string;
  text: string;
  points: string[];
}

interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

/** Company Portal's public page: what the product does, why it helps, and a sign-in card for existing customers. */
@Component({
  selector: 'app-landing',
  imports: [ReactiveFormsModule, RouterLink, Icon],
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

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly showPin = signal(false);
  protected readonly forgotOpen = signal(false);
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** The eight modules in the strip under the hero (and in more detail further down). */
  protected readonly modules: Module[] = [
    {
      icon: 'users', tone: 'blue', title: 'Employee Management', short: 'Employees',
      text: 'One record for every person: profile, documents, bank details, designation and who they report to.',
      points: ['Org chart built from reporting lines', 'PAN, ID and offer-letter documents', 'Roles: owner, admin, manager, employee'],
    },
    {
      icon: 'calendar', tone: 'green', title: 'Attendance & Leave', short: 'Attendance',
      text: 'Check-in with photo and location from any phone, leave requests with approvals, holidays and leave plans.',
      points: ['Selfie + GPS check-in and check-out', 'Leave balances, grants and approvals', 'Office and restricted holidays'],
    },
    {
      icon: 'wallet', tone: 'amber', title: 'Payroll & Payslip', short: 'Payslip',
      text: 'Salary structures from your own pay components, monthly payslips as PDF and income-tax estimates.',
      points: ['Earnings, deductions, reimbursements', 'Payslip PDFs employees can download', 'Travel allowance claims'],
    },
    {
      icon: 'clipboard', tone: 'violet', title: 'Work Log & Productivity', short: 'Work Log',
      text: 'Daily work logs against targets, tasks with due dates, work-hour rules and performance reviews.',
      points: ['Tasks assigned and tracked to done', 'Work-hour rules per brand', 'Review cycles with star ratings'],
    },
    {
      icon: 'box', tone: 'orange', title: 'Product Management', short: 'Products',
      text: 'Items, categories and suppliers, purchases and stock received — with QR labels you can scan.',
      points: ['Purchase bills and stock ledger', 'Printable QR item labels', 'Stock scanning from the phone'],
    },
    {
      icon: 'chart', tone: 'pink', title: 'Sales Management', short: 'Sales',
      text: 'Quotations, invoices and receipts, payments in and out, bank reconciliation and sales reports.',
      points: ['Quotes, invoices and receipts as PDF', 'UPI QR and online payments', 'Bank statement reconciliation'],
    },
    {
      icon: 'userCheck', tone: 'teal', title: 'Customer Management', short: 'Customers',
      text: 'Customers and their projects in one place, with a private link customers use to follow progress.',
      points: ['Project stages and photo updates', 'Customer progress-tracking link', 'Mail customers from the portal'],
    },
    {
      icon: 'briefcase', tone: 'purple', title: 'Agent Management', short: 'Agents',
      text: 'Sales agents and partners with their own profiles, the customers they bring and the commission due.',
      points: ['Agent profiles and photos', 'Commission per sale', 'Who brought which customer'],
    },
  ];

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

  protected show(name: 'userId' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.auth.logout();
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) return;

    this.busy.set(true);
    const { userId, password } = this.form.getRawValue();
    this.auth.login(userId.trim(), password).subscribe({
      next: (user) => this.router.navigateByUrl(user.mustChangePassword ? '/portal/change-pin' : '/portal'),
      error: (err) => {
        this.error.set(apiProblem(err).message);
        this.form.controls.password.reset();
        this.busy.set(false);
      },
    });
  }
}
