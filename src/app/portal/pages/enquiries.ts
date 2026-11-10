/*
 * Copyright (c) 2026 AMSIDEL Technologies. All rights reserved.
 * Designed and developed by AMSIDEL Technologies.
 */
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { API_BASE } from '../portal.config';
import { apiProblem, TagSeverity } from '../portal.models';
import { ExcelTable } from '../excel-export';

const API = `${API_BASE}/api/enquiries`;

type Kind = 'CALLBACK' | 'DEMO';
type Status = 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'WON' | 'CLOSED';

interface Enquiry {
  id: number;
  kind: Kind;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  /** What they looked at in the chat (Pricing, a module, a question). */
  message: string | null;
  demoDate: string | null;
  demoTime: string | null;
  /** Whether the notification mail reached the sales team. */
  notified: boolean;
  createdAt: string;
  status: Status;
  notes: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
}

const STATUSES: { value: Status; label: string; severity: TagSeverity }[] = [
  { value: 'NEW', label: 'New', severity: 'danger' },
  { value: 'CONTACTED', label: 'Contacted', severity: 'info' },
  { value: 'DEMO_SCHEDULED', label: 'Demo scheduled', severity: 'warn' },
  { value: 'WON', label: 'Won', severity: 'success' },
  { value: 'CLOSED', label: 'Closed', severity: 'secondary' },
];

/**
 * Administration > Website enquiries: call-back and demo requests from the website's support chat, newest first, and
 * the sales team's follow-up (status and notes). Owners and admins, and those given the menu's own tick.
 */
@Component({
  selector: 'app-enquiries',
  imports: [ExcelTable, DatePipe, FormsModule, ButtonModule, DialogModule, IconFieldModule, InputIconModule, InputTextModule,
    MessageModule, SelectModule, TableModule, TagModule, TextareaModule],
  template: `
    <div class="p-head">
      <div>
        <h1>Website enquiries</h1>
        <p>Call-back and demo requests from the website chat. Call them, then record what happened so the team knows who is next.</p>
      </div>
      <div class="head-actions"><p-button label="Refresh" icon="pi pi-refresh" [outlined]="true" [loading]="loading()" (onClick)="load()" /></div>
    </div>
    @if (error()) { <p-message severity="error" styleClass="page-message">{{ error() }}</p-message> }

    <div class="tiles" role="group" aria-label="Filter by status">
      <button type="button" class="tile" [class.on]="status() === null" (click)="status.set(null)">
        <b>{{ rows().length }}</b><span>All</span>
      </button>
      @for (s of statuses; track s.value) {
        <button type="button" class="tile tile--{{ s.value }}" [class.on]="status() === s.value" (click)="status.set(status() === s.value ? null : s.value)">
          <b>{{ count(s.value) }}</b><span>{{ s.label }}</span>
        </button>
      }
    </div>

    <section class="p-card">
      <div class="filters">
        <p-iconfield>
          <p-inputicon styleClass="pi pi-search" />
          <input pInputText type="search" placeholder="Search name, phone, email, company" aria-label="Search enquiries"
                 [ngModel]="search()" (ngModelChange)="search.set($event)" />
        </p-iconfield>
        <p-select [options]="kinds" optionLabel="label" optionValue="value" [ngModel]="kind()" (ngModelChange)="kind.set($event)"
                  ariaLabel="Request type" appendTo="body" />
      </div>

      <p-table appExcel="Website enquiries" [value]="shown()" dataKey="id" styleClass="p-stack" [loading]="loading()"
               [paginator]="shown().length > 25" [rows]="25">
        <ng-template #header>
          <tr><th>Received</th><th>Request</th><th>Name</th><th>Contact</th><th>Interested in</th><th>Status</th><th>Follow-up</th><th></th></tr>
        </ng-template>
        <ng-template #body let-e>
          <tr [class.new]="e.status === 'NEW'">
            <td data-label="Received" class="nowrap">{{ e.createdAt | date: 'd MMM y' }}<small class="muted block">{{ e.createdAt | date: 'h:mm a' }}</small></td>
            <td data-label="Request">
              @if (e.kind === 'DEMO') {
                <p-tag value="Demo" severity="contrast" />
                <small class="block demo">{{ e.demoDate | date: 'EEE d MMM' }} · {{ time(e.demoTime) }}</small>
              } @else { <p-tag value="Call back" severity="secondary" /> }
            </td>
            <td data-label="Name" class="stack-full"><b>{{ e.name }}</b>@if (e.company) { <small class="muted block">{{ e.company }}</small> }</td>
            <td data-label="Contact">
              <a class="block" [href]="'tel:' + tel(e.phone)">{{ e.phone }}</a>
              <a class="block email" [href]="'mailto:' + e.email">{{ e.email }}</a>
              @if (!e.notified) { <small class="warn block" title="The notification mail to the sales team was not sent"><i class="pi pi-exclamation-triangle" aria-hidden="true"></i> Not mailed</small> }
            </td>
            <td data-label="Interested in" class="interest">{{ e.message || '—' }}</td>
            <td data-label="Status"><p-tag [value]="label(e.status)" [severity]="severity(e.status)" /></td>
            <td data-label="Follow-up" class="notes">
              @if (e.notes) { <span class="note">{{ e.notes }}</span> }
              @if (e.updatedAt) { <small class="muted block">{{ e.updatedByName }} · {{ e.updatedAt | date: 'd MMM, h:mm a' }}</small> }
              @if (!e.notes && !e.updatedAt) { <span class="muted">—</span> }
            </td>
            <td class="stack-end nowrap">
              <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" [ariaLabel]="'Follow up ' + e.name" (onClick)="edit(e)" />
              <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger" [ariaLabel]="'Delete ' + e.name" (onClick)="remove(e)" />
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr><td colspan="8" class="p-empty">{{ loading() ? 'Loading…' : rows().length ? 'No enquiries match these filters.' : 'No enquiries yet. They appear here when visitors use the website chat.' }}</td></tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog [visible]="!!editing()" (visibleChange)="!$event && editing.set(null)" [modal]="true" [draggable]="false"
              [style]="{ width: '560px' }" [breakpoints]="{ '600px': 'calc(100vw - 16px)' }" [header]="'Follow up · ' + (editing()?.name ?? '')">
      @if (editing(); as e) {
        <dl class="facts">
          <dt>Request</dt><dd>{{ e.kind === 'DEMO' ? 'Demo on ' + (e.demoDate | date: 'EEEE d MMMM y') + ' at ' + time(e.demoTime) : 'Call back' }}</dd>
          <dt>Phone</dt><dd><a [href]="'tel:' + tel(e.phone)">{{ e.phone }}</a></dd>
          <dt>Email</dt><dd><a [href]="'mailto:' + e.email">{{ e.email }}</a></dd>
          @if (e.company) { <dt>Company</dt><dd>{{ e.company }}</dd> }
          <dt>Interested in</dt><dd>{{ e.message || '—' }}</dd>
          <dt>Received</dt><dd>{{ e.createdAt | date: 'd MMM y, h:mm a' }}</dd>
        </dl>
        <div class="form">
          <div class="pf"><label for="eq-status">Status *</label>
            <p-select inputId="eq-status" [options]="statuses" optionLabel="label" optionValue="value" appendTo="body"
                      [ngModel]="newStatus()" (ngModelChange)="newStatus.set($event)" /></div>
          <div class="pf"><label for="eq-notes">Notes</label>
            <textarea pTextarea id="eq-notes" rows="4" maxlength="1000" placeholder="What was said, and the next step"
                      [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea>
            <small class="muted">{{ notes().length }} / 1000</small></div>
        </div>
        @if (formError()) { <p-message severity="error" styleClass="msg">{{ formError() }}</p-message> }
      }
      <ng-template #footer>
        <p-button label="Cancel" [text]="true" (onClick)="editing.set(null)" />
        <p-button label="Save" icon="pi pi-check" [loading]="busy()" (onClick)="save()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .block { display: block; }
    .nowrap { white-space: nowrap; }
    small { font-size: .78rem; }
    .tiles { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
    .tile {
      display: grid; gap: 2px; padding: 12px 14px; text-align: left; cursor: pointer; font: inherit;
      border: 1px solid var(--line, #e5e7eb); border-radius: 10px; background: var(--surface, #fff); color: inherit;
      b { font-size: 1.4rem; line-height: 1.1; }
      span { font-size: .82rem; color: var(--muted); }
      &.on { border-color: var(--brass-dark, #6a4bf0); box-shadow: inset 0 0 0 1px var(--brass-dark, #6a4bf0); }
    }
    .tile--NEW b { color: #b91c1c; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .filters p-iconfield { flex: 1 1 260px; }
    .filters input { width: 100%; }
    tr.new td:first-child { box-shadow: inset 3px 0 0 #dc2626; }
    .email { overflow-wrap: anywhere; font-size: .86rem; }
    .demo { margin-top: 4px; font-weight: 600; }
    .warn { color: #b45309; margin-top: 2px; }
    .interest { max-width: 220px; font-size: .86rem; }
    .notes { max-width: 260px; }
    .note { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: .86rem; }
    .facts { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0 0 16px; font-size: .92rem; }
    .facts dt { color: var(--muted); }
    .facts dd { margin: 0; overflow-wrap: anywhere; }
    .form { display: grid; gap: 12px; }
    .form textarea { width: 100%; }
    :host ::ng-deep .form .p-select { width: 100%; }
    :host ::ng-deep .msg { margin-top: 12px; }
    @media (max-width: 900px) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  `,
})
export class Enquiries implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly confirm = inject(ConfirmationService);
  private readonly toast = inject(MessageService);

  protected readonly statuses = STATUSES;
  protected readonly kinds = [
    { value: null, label: 'All requests' },
    { value: 'CALLBACK', label: 'Call backs' },
    { value: 'DEMO', label: 'Demos' },
  ];

  protected readonly rows = signal<Enquiry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly status = signal<Status | null>(null);
  protected readonly kind = signal<Kind | null>(null);
  protected readonly search = signal('');

  protected readonly shown = computed(() => {
    const q = this.search().trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return this.rows().filter((e) =>
      (!this.status() || e.status === this.status()) &&
      (!this.kind() || e.kind === this.kind()) &&
      (!q || [e.name, e.email, e.company ?? ''].some((v) => v.toLowerCase().includes(q))
        || (digits.length >= 3 && e.phone.replace(/\D/g, '').includes(digits))));
  });

  protected readonly editing = signal<Enquiry | null>(null);
  protected readonly newStatus = signal<Status>('NEW');
  protected readonly notes = signal('');
  protected readonly formError = signal('');
  protected readonly busy = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Enquiry[]>(API).subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.error.set(apiProblem(e).message); },
    });
  }

  protected count(s: Status): number {
    return this.rows().filter((e) => e.status === s).length;
  }

  protected label(s: Status): string {
    return STATUSES.find((x) => x.value === s)?.label ?? s;
  }

  protected severity(s: Status): TagSeverity {
    return STATUSES.find((x) => x.value === s)?.severity ?? 'secondary';
  }

  protected tel(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /** "14:00:00" → "2:00 pm". */
  protected time(t: string | null): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  protected edit(e: Enquiry): void {
    // a new one opened for follow-up is usually being called now
    this.newStatus.set(e.status === 'NEW' ? 'CONTACTED' : e.status);
    this.notes.set(e.notes ?? '');
    this.formError.set('');
    this.editing.set(e);
  }

  protected save(): void {
    const e = this.editing();
    if (!e) return;
    this.busy.set(true);
    this.formError.set('');
    this.http.put<Enquiry>(`${API}/${e.id}`, { status: this.newStatus(), notes: this.notes().trim() || null }).subscribe({
      next: (saved) => {
        this.busy.set(false);
        this.editing.set(null);
        this.rows.update((all) => all.map((x) => (x.id === saved.id ? saved : x)));
        this.toast.add({ severity: 'success', summary: 'Enquiry updated', detail: `${saved.name}: ${this.label(saved.status)}` });
      },
      error: (err) => {
        this.busy.set(false);
        const p = apiProblem(err);
        this.formError.set(Object.values(p.fields)[0] ?? p.message);
      },
    });
  }

  protected remove(e: Enquiry): void {
    this.confirm.confirm({
      header: `Delete the enquiry from ${e.name}?`,
      message: 'Use this for spam or duplicates. It is removed for good; to keep a record, set the status to Closed instead.',
      icon: 'pi pi-trash', acceptLabel: 'Delete', rejectLabel: 'Keep', acceptButtonProps: { severity: 'danger' }, rejectButtonProps: { outlined: true },
      accept: () => this.http.delete<void>(`${API}/${e.id}`).subscribe({
        next: () => {
          this.rows.update((all) => all.filter((x) => x.id !== e.id));
          this.toast.add({ severity: 'success', summary: 'Enquiry deleted', detail: e.name });
        },
        error: (err) => this.toast.add({ severity: 'error', summary: 'Not deleted', detail: apiProblem(err).message, life: 8000 }),
      }),
    });
  }
}
