/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { PhoneInput, phoneProblem } from '../phone-input';
import { apiProblem } from '../portal.models';
import { Agent, AgentsService, bankProblem } from './agents.service';

/**
 * Adding an agent without leaving the page, e.g. from a project ("new agent"), for the project's brand. The details
 * are the Agents page's; a photo can be added there later. Needs the Add agent tick (the server checks it too).
 */
@Component({
  selector: 'app-agent-form',
  imports: [PhoneInput, FormsModule, ButtonModule, DialogModule, InputTextModule, MessageModule, TextareaModule],
  template: `
    <p-dialog header="Add agent" [modal]="true" [visible]="visible()" (visibleChange)="visible.set($event)"
              [style]="{ width: '600px' }" [breakpoints]="{ '760px': 'calc(100vw - 16px)' }" [draggable]="false" appendTo="body">
      <p class="muted intro">The agent is added to {{ brandName() || 'the project\\'s brand' }}. A photo can be added later on the Agents page.</p>
      <div class="grid">
        <div class="pf"><label for="aq-name">Name *</label><input pInputText id="aq-name" maxlength="150" [(ngModel)]="f.name" /></div>
        <div class="pf"><label for="aq-ph">Phone *</label><app-phone-input inputId="aq-ph" label="phone" [required]="true" [(ngModel)]="f.phone" /></div>
        <div class="pf"><label for="aq-loc">Location</label><input pInputText id="aq-loc" maxlength="100" placeholder="Town or area" [(ngModel)]="f.location" /></div>
        <div class="pf"><label for="aq-upi">UPI ID <span class="opt">(for commission)</span></label>
          <input pInputText id="aq-upi" maxlength="80" placeholder="name@bank" [(ngModel)]="f.upiId" /></div>
        <div class="pf"><label for="aq-acc">Bank account no</label>
          <input pInputText id="aq-acc" maxlength="20" inputmode="numeric" placeholder="Digits only" [ngModel]="f.bankAccount"
                 (ngModelChange)="f.bankAccount = $event.replace(/\D/g, '')" /></div>
        <div class="pf"><label for="aq-ifsc">IFSC</label>
          <input pInputText id="aq-ifsc" maxlength="11" placeholder="HDFC0001234" [ngModel]="f.ifsc" (ngModelChange)="f.ifsc = $event.toUpperCase()" /></div>
        <div class="pf span"><label for="aq-addr">Address</label>
          <textarea pTextarea id="aq-addr" rows="2" maxlength="500" [autoResize]="true" [(ngModel)]="f.address"></textarea></div>
        <div class="pf span"><label for="aq-notes">Notes</label>
          <input pInputText id="aq-notes" maxlength="500" placeholder="How you know them, for example" [(ngModel)]="f.notes" /></div>
        @if (error()) { <p-message severity="error" styleClass="span">{{ error() }}</p-message> }
      </div>
      <ng-template #footer>
        <p-button label="Cancel" [text]="true" (onClick)="visible.set(false)" />
        <p-button label="Save agent" icon="pi pi-check" [loading]="busy()" (onClick)="save()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .intro { margin: 0 0 14px; font-size: .88rem; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .span { grid-column: 1 / -1; }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class AgentForm {
  private readonly api = inject(AgentsService);
  private readonly toast = inject(MessageService);

  readonly visible = model(false);
  /** The brand the agent belongs to (the project's). */
  readonly brandId = input<number | null>(null);
  readonly brandName = input<string | null>(null);
  readonly saved = output<Agent>();

  protected f = blank();
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  constructor() {
    // a fresh form each time it opens
    effect(() => {
      if (this.visible()) {
        this.f = blank();
        this.error.set('');
      }
    });
  }

  protected save(): void {
    const brandId = this.brandId();
    if (!brandId) return this.error.set('Choose the project\'s brand first.');
    if (!this.f.name.trim()) return this.error.set('Give the name.');
    const phone = phoneProblem(this.f.phone, true);
    if (phone) return this.error.set('Phone: ' + phone);
    const bank = bankProblem(this.f.bankAccount, this.f.ifsc);
    if (bank) return this.error.set(bank);
    this.busy.set(true);
    this.error.set('');
    this.api.save(null, {
      brandId, name: this.f.name.trim(), phone: this.f.phone, address: this.f.address.trim(), location: this.f.location.trim(),
      upiId: this.f.upiId.trim(), bankAccount: this.f.bankAccount.trim(), ifsc: this.f.ifsc.trim(), notes: this.f.notes.trim(), active: true,
    }).subscribe({
      next: (a) => {
        this.busy.set(false);
        this.visible.set(false);
        this.toast.add({ severity: 'success', summary: 'Agent added', detail: `${a.name} (${a.code})` });
        this.saved.emit(a);
      },
      error: (err) => {
        this.busy.set(false);
        const p = apiProblem(err);
        this.error.set(Object.values(p.fields)[0] ?? p.message);
      },
    });
  }
}

function blank() {
  return { name: '', phone: '', address: '', location: '', upiId: '', bankAccount: '', ifsc: '', notes: '' };
}
