/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { apiProblem } from '../portal.models';
import { KINDS, PayComponent, PayKind, PtSlab, rupeesRound } from './payroll.models';
import { PayrollService } from './payroll.service';
import { ExcelTable } from '../excel-export';

/** Payroll > Pay components: the earnings, deductions and reimbursements every salary is made of. */
@Component({
  selector: 'app-pay-components',
  imports: [
    ExcelTable,
    FormsModule, RouterLink, ButtonModule, DialogModule, InputNumberModule, InputTextModule, MessageModule, SelectModule,
    TableModule, TagModule, ToggleSwitchModule,
  ],
  template: `
    <div class="p-head">
      <div>
        <a class="back" routerLink="/portal/payroll">← Salaries</a>
        <h1>Pay components</h1>
        <p>The lines of every salary. Net pay = earnings − deductions + reimbursements.</p>
      </div>
      <div class="head-actions"><p-button label="New component" icon="pi pi-plus" size="small" (onClick)="edit(null)" /></div>
    </div>
    @if (error()) { <p-message severity="error" styleClass="page-message">{{ error() }}</p-message> }

    @for (k of kinds; track k.value) {
      <section class="p-card">
        <h2>{{ k.plural }}</h2>
        <p-table [appExcel]="k.plural" [value]="of(k.value)" dataKey="id" styleClass="p-stack" [tableStyle]="{ 'min-width': '560px' }">
          <ng-template #header>
            <tr><th>Name</th><th>Code</th><th>Order</th><th>Status</th><th></th></tr>
          </ng-template>
          <ng-template #body let-c>
            <tr class="row-link" (click)="edit(c)">
              <td data-label="Name" class="stack-full"><b>{{ c.name }}</b></td>
              <td data-label="Code"><code>{{ c.code }}</code></td>
              <td data-label="Order">{{ c.sortOrder }}</td>
              <td data-label="Status">
                <p-tag [value]="c.active ? 'In use' : 'Retired'" [severity]="c.active ? 'success' : 'secondary'" />
                @if (c.tax) { <p-tag value="Tax" severity="info" styleClass="ml" /> }
              </td>
              <td class="stack-end">
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small" [ariaLabel]="'Edit ' + c.name" (onClick)="edit(c)" />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="5" class="p-empty">No {{ k.plural.toLowerCase() }} yet.</td></tr>
          </ng-template>
        </p-table>
      </section>
    }

    <section class="p-card">
      <div class="card-head">
        <h2>Professional tax slabs</h2>
        <p-button label="Add a slab" icon="pi pi-plus" [outlined]="true" size="small" [disabled]="slabs().length >= 30" (onClick)="addSlab()" />
      </div>
      <p class="muted intro">The tax is per half year (April–September, October–March), on that half year's gross pay, and is spread
        over its months. The starting slabs are Kerala's: check them against the current notification for your state.</p>
      <table class="slabs" aria-label="Professional tax slabs">
        <thead><tr><th>Half-year gross from</th><th>Tax for the half year</th><th class="up-to">Up to</th><th></th></tr></thead>
        <tbody>
          @for (s of slabs(); track $index; let i = $index) {
            <tr>
              <td><p-inputnumber [inputId]="'pt-from-' + i" mode="currency" currency="INR" locale="en-IN" [maxFractionDigits]="2" [min]="0"
                                 [max]="999999999999" [disabled]="i === 0" [ariaLabel]="'Slab ' + (i + 1) + ': half-year gross from'"
                                 [ngModel]="s.fromIncome" (ngModelChange)="setSlab(i, 'fromIncome', $event)" /></td>
              <td><p-inputnumber [inputId]="'pt-tax-' + i" mode="currency" currency="INR" locale="en-IN" [maxFractionDigits]="2" [min]="0"
                                 [max]="99999999" placeholder="₹0" [ariaLabel]="'Slab ' + (i + 1) + ': tax for the half year'"
                                 [ngModel]="s.halfYearTax" (ngModelChange)="setSlab(i, 'halfYearTax', $event)" /></td>
              <td class="up-to muted">{{ upTo(i) }}</td>
              <td>
                @if (i > 0) {
                  <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger"
                            [ariaLabel]="'Remove slab ' + (i + 1)" (onClick)="removeSlab(i)" />
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (slabError()) { <p-message severity="error" styleClass="dlg-msg">{{ slabError() }}</p-message> }
      <div class="slab-acts">
        <p-button label="Save slabs" icon="pi pi-check" [loading]="slabBusy()" (onClick)="saveSlabs()" />
        <small class="muted">The first slab starts at ₹0. Salaries with "Professional tax from the slabs" use them.</small>
      </div>
    </section>

    <p-dialog [header]="editing() ? 'Edit ' + editing()!.name : 'New pay component'" [modal]="true" [visible]="open()"
              (visibleChange)="open.set($event)" [style]="{ width: '480px' }" [breakpoints]="{ '760px': 'calc(100vw - 16px)' }"
              [draggable]="false">
      <div class="form">
        <div class="pf span"><label for="pc-name">Name <span class="req">*</span></label>
          <input pInputText id="pc-name" maxlength="60" placeholder="e.g. Performance bonus" [ngModel]="name()" (ngModelChange)="name.set($event)" /></div>
        <div class="pf"><label for="pc-code">Code <span class="req">*</span></label>
          <input pInputText id="pc-code" maxlength="20" placeholder="e.g. BONUS" [ngModel]="code()" (ngModelChange)="code.set($event)" /></div>
        <div class="pf"><label for="pc-kind">Kind <span class="req">*</span></label>
          <p-select inputId="pc-kind" [options]="kinds" optionLabel="label" optionValue="value" appendTo="body"
                    [disabled]="!!editing()?.inUse" [ngModel]="kind()" (ngModelChange)="kind.set($event)" />
          @if (editing()?.inUse) { <small class="hint">Used in salaries, so its kind stays.</small> }</div>
        <div class="pf"><label for="pc-order">Order</label>
          <p-inputnumber inputId="pc-order" [min]="0" [max]="999" [showButtons]="true" [step]="10"
                         [ngModel]="order()" (ngModelChange)="order.set($event ?? 0)" /></div>
        <div class="pf"><span class="pf-label">Tax</span>
          <label class="check" for="pc-tax"><p-toggleswitch inputId="pc-tax" [ngModel]="tax()" (ngModelChange)="tax.set($event)" />
            {{ tax() ? 'Counts as tax paid' : 'Not a tax' }}</label></div>
        <div class="pf"><span class="pf-label">Status</span>
          <label class="check" for="pc-active"><p-toggleswitch inputId="pc-active" [ngModel]="active()" (ngModelChange)="active.set($event)" />
            {{ active() ? 'In use' : 'Retired (not offered for new salaries)' }}</label></div>
      </div>
      @if (formError()) { <p-message severity="error" styleClass="dlg-msg">{{ formError() }}</p-message> }
      <ng-template #footer>
        @if (editing() && !editing()!.inUse) {
          <p-button label="Delete" icon="pi pi-trash" severity="danger" [text]="true" styleClass="left" (onClick)="remove()" />
        }
        <p-button label="Cancel" [text]="true" (onClick)="open.set(false)" />
        <p-button label="Save" icon="pi pi-check" [loading]="busy()" (onClick)="save()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form .span { grid-column: 1 / -1; }
    code { font-size: .8rem; padding: 2px 6px; border-radius: 4px; background: var(--accent-soft); color: var(--brass-dark); }
    :host ::ng-deep .dlg-msg { margin-top: 12px; }
    :host ::ng-deep .left { margin-right: auto; }
    :host ::ng-deep .ml { margin-left: 6px; }
    .card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .card-head h2 { margin: 0; }
    .intro { margin: 8px 0 12px; font-size: .88rem; }
    .muted { color: var(--muted); }
    .slabs { border-collapse: collapse; width: 100%; max-width: 680px; }
    .slabs th { text-align: left; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--pine); font-weight: 700;
      padding: 6px 8px; border-bottom: 1px solid var(--line); }
    .slabs td { padding: 6px 8px; border-bottom: 1px solid var(--line); }
    .slabs .up-to { font-size: .85rem; white-space: nowrap; }
    :host ::ng-deep .slabs .p-inputnumber, :host ::ng-deep .slabs .p-inputnumber-input { width: 100%; min-width: 0; }
    .slab-acts { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
    .slab-acts small { font-size: .8rem; }
    @media (max-width: 760px) { .form { grid-template-columns: 1fr; } .slabs .up-to { display: none; } }
  `,
})
export class PayComponents implements OnInit {
  private readonly payroll = inject(PayrollService);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly kinds = KINDS;
  protected readonly list = signal<PayComponent[]>([]);
  protected readonly error = signal('');
  protected readonly open = signal(false);
  protected readonly editing = signal<PayComponent | null>(null);
  protected readonly name = signal('');
  protected readonly code = signal('');
  protected readonly kind = signal<PayKind>('EARNING');
  protected readonly order = signal(10);
  protected readonly active = signal(true);
  protected readonly tax = signal(false);
  protected readonly formError = signal('');
  protected readonly busy = signal(false);
  /** The professional tax slabs being edited, lowest first. */
  protected readonly slabs = signal<{ fromIncome: number | null; halfYearTax: number | null }[]>([]);
  protected readonly slabError = signal('');
  protected readonly slabBusy = signal(false);

  ngOnInit(): void {
    this.load();
    this.loadSlabs();
  }

  /** Where a slab ends: the day before the next one starts. */
  protected upTo(i: number): string {
    const next = this.slabs()[i + 1]?.fromIncome;
    return next == null ? 'and above' : 'below ' + rupeesRound(next);
  }

  protected setSlab(i: number, field: 'fromIncome' | 'halfYearTax', value: number | null): void {
    this.slabs.update((list) => list.map((s, j) => (j === i ? { ...s, [field]: value } : s)));
  }

  protected addSlab(): void {
    const last = this.slabs().at(-1);
    this.slabs.update((list) => [...list, { fromIncome: last ? Number(last.fromIncome ?? 0) + 1 : 0, halfYearTax: null }]);
  }

  protected removeSlab(i: number): void {
    this.slabs.update((list) => list.filter((_, j) => j !== i));
  }

  protected saveSlabs(): void {
    this.slabError.set('');
    const list = this.slabs();
    if (!list.length) return this.slabError.set('Give at least one slab.');
    if (list.some((s) => s.fromIncome == null || s.halfYearTax == null)) return this.slabError.set('Fill in every slab, or remove the empty ones.');
    const slabs: PtSlab[] = list.map((s) => ({ fromIncome: Number(s.fromIncome), halfYearTax: Number(s.halfYearTax) }));
    if (slabs[0].fromIncome !== 0) return this.slabError.set('The first slab starts at ₹0.');
    if (slabs.some((s, i) => i > 0 && s.fromIncome <= slabs[i - 1].fromIncome)) {
      return this.slabError.set('Each slab starts above the one before it.');
    }
    this.slabBusy.set(true);
    this.payroll.savePtSlabs(slabs).subscribe({
      next: (saved) => {
        this.slabBusy.set(false);
        this.slabs.set(saved.map((s) => ({ ...s })));
        this.toast.add({ severity: 'success', summary: 'Professional tax slabs saved', detail: `${saved.length} slab${saved.length === 1 ? '' : 's'}` });
      },
      error: (err) => {
        this.slabBusy.set(false);
        const p = apiProblem(err);
        this.slabError.set(Object.values(p.fields)[0] ?? p.message);
      },
    });
  }

  private loadSlabs(): void {
    this.payroll.ptSlabs().subscribe({
      next: (l) => this.slabs.set(l.length ? l.map((s) => ({ ...s })) : [{ fromIncome: 0, halfYearTax: 0 }]),
      error: (err) => this.slabError.set(apiProblem(err).message),
    });
  }

  protected of(kind: PayKind): PayComponent[] {
    return this.list().filter((c) => c.kind === kind);
  }

  protected edit(c: PayComponent | null): void {
    this.editing.set(c);
    this.name.set(c?.name ?? '');
    this.code.set(c?.code ?? '');
    this.kind.set(c?.kind ?? 'EARNING');
    this.order.set(c?.sortOrder ?? (Math.max(0, ...this.list().map((x) => x.sortOrder)) + 10));
    this.active.set(c?.active ?? true);
    this.tax.set(c?.tax ?? false);
    this.formError.set('');
    this.open.set(true);
  }

  protected save(): void {
    if (!this.name().trim() || !this.code().trim()) return this.formError.set('Give the component a name and a code.');
    this.busy.set(true);
    this.payroll
      .saveComponent({ name: this.name().trim(), code: this.code().trim(), kind: this.kind(), sortOrder: this.order(), active: this.active(), tax: this.tax() },
        this.editing()?.id)
      .subscribe({
        next: (c) => {
          this.busy.set(false);
          this.open.set(false);
          this.toast.add({ severity: 'success', summary: 'Component saved', detail: c.name });
          this.load();
        },
        error: (err) => {
          this.busy.set(false);
          const p = apiProblem(err);
          this.formError.set(Object.values(p.fields)[0] ?? p.message);
        },
      });
  }

  protected remove(): void {
    const c = this.editing();
    if (!c) return;
    this.confirm.confirm({
      header: 'Delete component',
      message: `Delete ${c.name}? No salary uses it.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Keep',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { outlined: true },
      accept: () =>
        this.payroll.deleteComponent(c.id).subscribe({
          next: () => {
            this.open.set(false);
            this.toast.add({ severity: 'success', summary: 'Component deleted', detail: c.name });
            this.load();
          },
          error: (err) => this.formError.set(apiProblem(err).message),
        }),
    });
  }

  private load(): void {
    this.payroll.components().subscribe({ next: (l) => this.list.set(l), error: (err) => this.error.set(apiProblem(err).message) });
  }
}
