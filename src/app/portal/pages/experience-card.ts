/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { API_BASE } from '../portal.config';
import { apiProblem, toIsoDate } from '../portal.models';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

export interface Job {
  id: number;
  companyName: string;
  jobTitle: string;
  employmentType: EmploymentType;
  location: string | null;
  startMonth: string;
  endMonth: string | null;
  current: boolean;
  months: number;
  responsibilities: string | null;
  achievements: string | null;
  tools: string | null;
  reasonForLeaving: string | null;
}

export interface Experience {
  jobs: Job[];
  monthsBefore: number;
  monthsHere: number;
  monthsTotal: number;
}

const TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

/** The wizard's steps, and the fields each one holds (a field the server refuses takes you back to its step). */
const STEPS = [
  { title: 'Company & role', icon: 'pi pi-building', fields: ['companyName', 'jobTitle', 'employmentType', 'location'] },
  { title: 'Dates', icon: 'pi pi-calendar', fields: ['startMonth', 'endMonth', 'reasonForLeaving'] },
  { title: 'The work', icon: 'pi pi-briefcase', fields: ['responsibilities', 'achievements', 'tools'] },
  { title: 'Review', icon: 'pi pi-check', fields: [] as string[] },
];

/**
 * A person's work experience: earlier jobs as a timeline, latest first, with the total before this company and here.
 * Without employeeId: my own, which I add and change with a four-step wizard (company and role, dates, the work,
 * review); with it: that person's, read-only (their record).
 */
@Component({
  selector: 'app-experience-card',
  imports: [FormsModule, ButtonModule, CheckboxModule, DatePickerModule, DialogModule, InputTextModule, MessageModule, SelectButtonModule,
    TextareaModule],
  template: `
    <section class="p-card">
      <div class="x-head">
        <h2>{{ mine() ? 'My experience' : 'Experience' }}</h2>
        @if (mine()) {
          <p-button label="Add experience" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="openAdd()" />
        }
      </div>

      @if (data(); as d) {
        <div class="totals">
          <div><span>Before {{ company() }}</span><b>{{ duration(d.monthsBefore) }}</b></div>
          <div><span>At {{ company() }}</span><b>{{ duration(d.monthsHere) }}</b></div>
          <div class="total"><span>Total experience</span><b>{{ duration(d.monthsTotal) }}</b></div>
        </div>

        @if (d.jobs.length) {
          <ol class="timeline">
            @for (j of d.jobs; track j.id) {
              <li class="job">
                <span class="dot" [class.now]="j.current" aria-hidden="true"></span>
                <div class="j-card">
                  <div class="j-top">
                    <div>
                      <h3>{{ j.jobTitle }}</h3>
                      <p class="j-co">{{ j.companyName }}<span class="sep">·</span>{{ typeLabel(j.employmentType) }}@if (j.location) {<span class="sep">·</span>{{ j.location }}}</p>
                      <p class="j-dates">{{ month(j.startMonth) }} – {{ j.current ? 'Present' : month(j.endMonth) }}
                        <span class="pill">{{ duration(j.months) }}</span>
                        @if (j.current) { <span class="pill now">Current</span> }</p>
                    </div>
                    @if (mine()) {
                      <span class="j-actions">
                        <button type="button" class="icon" [attr.aria-label]="'Change ' + j.jobTitle + ' at ' + j.companyName" title="Change" (click)="openEdit(j)"><i class="pi pi-pencil"></i></button>
                        <button type="button" class="icon danger" [attr.aria-label]="'Delete ' + j.jobTitle + ' at ' + j.companyName" title="Delete" (click)="remove(j)"><i class="pi pi-trash"></i></button>
                      </span>
                    }
                  </div>
                  @if (j.responsibilities) { <p class="j-text">{{ j.responsibilities }}</p> }
                  @if (j.achievements) { <p class="j-text"><b>Achievements:</b> {{ j.achievements }}</p> }
                  @if (j.tools) {
                    <div class="tools">@for (t of toolList(j.tools); track t) { <span>{{ t }}</span> }</div>
                  }
                  @if (j.reasonForLeaving) { <p class="j-reason">Reason for leaving: {{ j.reasonForLeaving }}</p> }
                </div>
              </li>
            }
          </ol>
        } @else {
          <p class="x-empty">{{ mine() ? 'No earlier jobs listed yet. Add them with Add experience: it takes four short steps.' : 'No experience listed.' }}</p>
        }
      }
    </section>

    <p-dialog [header]="editingId() ? 'Change experience' : 'Add experience'" [modal]="true" [visible]="open()" (visibleChange)="open.set($event)"
              [draggable]="false" appendTo="body" [style]="{ width: '640px' }" [breakpoints]="{ '700px': 'calc(100vw - 16px)' }">
      <ol class="steps" aria-label="Steps">
        @for (s of steps; track s.title; let i = $index) {
          <li [class.done]="i < step()" [class.on]="i === step()" [attr.aria-current]="i === step() ? 'step' : null">
            <button type="button" [disabled]="i > furthest()" (click)="goTo(i)">
              <span class="n">@if (i < step()) { <i class="pi pi-check"></i> } @else { {{ i + 1 }} }</span>
              <span class="t">{{ s.title }}</span>
            </button>
          </li>
        }
      </ol>

      <div class="panel">
        @switch (step()) {
          @case (0) {
            <div class="grid">
              <div class="pf span"><label for="x-co">Company <span class="req">*</span></label>
                <input pInputText id="x-co" maxlength="150" placeholder="e.g. Infosys, Kochi" [invalid]="!!fe()['companyName']" [ngModel]="f.companyName()" (ngModelChange)="f.companyName.set($event)" />
                @if (fe()['companyName']; as m) { <small class="err">{{ m }}</small> }</div>
              <div class="pf"><label for="x-title">Job title <span class="req">*</span></label>
                <input pInputText id="x-title" maxlength="100" placeholder="e.g. Senior Developer" [invalid]="!!fe()['jobTitle']" [ngModel]="f.jobTitle()" (ngModelChange)="f.jobTitle.set($event)" />
                @if (fe()['jobTitle']; as m) { <small class="err">{{ m }}</small> }</div>
              <div class="pf"><label for="x-loc">Location</label>
                <input pInputText id="x-loc" maxlength="150" placeholder="e.g. Bengaluru, or Remote" [ngModel]="f.location()" (ngModelChange)="f.location.set($event)" /></div>
              <div class="pf span"><span class="pf-label" id="x-type">Type of employment <span class="req">*</span></span>
                <p-selectbutton [options]="types" optionLabel="label" optionValue="value" [allowEmpty]="false" ariaLabelledBy="x-type"
                                [ngModel]="f.employmentType()" (ngModelChange)="f.employmentType.set($event)" /></div>
            </div>
          }
          @case (1) {
            <div class="grid">
              <div class="pf"><label for="x-from">Started <span class="req">*</span></label>
                <p-datepicker inputId="x-from" view="month" dateFormat="M yy" [showIcon]="true" [readonlyInput]="true" appendTo="body"
                              placeholder="Month and year" [maxDate]="today" [invalid]="!!fe()['startMonth']"
                              [ngModel]="f.start()" (ngModelChange)="f.start.set($event)" />
                @if (fe()['startMonth']; as m) { <small class="err">{{ m }}</small> }</div>
              <div class="pf"><label for="x-to">Left @if (!f.current()) { <span class="req">*</span> }</label>
                <p-datepicker inputId="x-to" view="month" dateFormat="M yy" [showIcon]="true" [readonlyInput]="true" appendTo="body"
                              [placeholder]="f.current() ? 'Present' : 'Month and year'" [disabled]="f.current()" [minDate]="f.start() ?? undefined"
                              [maxDate]="today" [invalid]="!!fe()['endMonth']" [ngModel]="f.end()" (ngModelChange)="f.end.set($event)" />
                @if (fe()['endMonth']; as m) { <small class="err">{{ m }}</small> }</div>
              <div class="pf span check">
                <p-checkbox inputId="x-now" [binary]="true" [ngModel]="f.current()" (ngModelChange)="setCurrent($event)" />
                <label for="x-now">I still work here</label>
              </div>
              @if (wizardMonths(); as n) { <p class="span hint">{{ duration(n) }}, both months counted.</p> }
              @if (!f.current()) {
                <div class="pf span"><label for="x-why">Reason for leaving <span class="opt">(optional)</span></label>
                  <input pInputText id="x-why" maxlength="300" placeholder="e.g. Better role, relocation" [ngModel]="f.reasonForLeaving()" (ngModelChange)="f.reasonForLeaving.set($event)" /></div>
              }
            </div>
          }
          @case (2) {
            <div class="grid">
              <div class="pf span"><label for="x-resp">Responsibilities</label>
                <textarea pTextarea id="x-resp" rows="4" maxlength="2000" [autoResize]="true" placeholder="What you did day to day, the team, the products"
                          [ngModel]="f.responsibilities()" (ngModelChange)="f.responsibilities.set($event)"></textarea>
                <small class="count">{{ (f.responsibilities() || '').length }} / 2000</small></div>
              <div class="pf span"><label for="x-ach">Key achievements</label>
                <textarea pTextarea id="x-ach" rows="3" maxlength="1000" [autoResize]="true" placeholder="Results you are proud of, with numbers where you can"
                          [ngModel]="f.achievements()" (ngModelChange)="f.achievements.set($event)"></textarea>
                <small class="count">{{ (f.achievements() || '').length }} / 1000</small></div>
              <div class="pf span"><label for="x-tools">Tools and technologies</label>
                <input pInputText id="x-tools" maxlength="300" placeholder="Separate with commas, e.g. Java, Spring Boot, AutoCAD"
                       [ngModel]="f.tools()" (ngModelChange)="f.tools.set($event)" /></div>
            </div>
          }
          @case (3) {
            <div class="review">
              <h3>{{ f.jobTitle() }}</h3>
              <p class="j-co">{{ f.companyName() }}<span class="sep">·</span>{{ typeLabel(f.employmentType()) }}@if (f.location()) {<span class="sep">·</span>{{ f.location() }}}</p>
              <p class="j-dates">{{ monthOf(f.start()) }} – {{ f.current() ? 'Present' : monthOf(f.end()) }}
                @if (wizardMonths(); as n) { <span class="pill">{{ duration(n) }}</span> }</p>
              <dl>
                <dt>Responsibilities</dt><dd>{{ f.responsibilities() || '—' }}</dd>
                <dt>Key achievements</dt><dd>{{ f.achievements() || '—' }}</dd>
                <dt>Tools and technologies</dt><dd>{{ f.tools() || '—' }}</dd>
                @if (!f.current()) { <dt>Reason for leaving</dt><dd>{{ f.reasonForLeaving() || '—' }}</dd> }
              </dl>
              <p class="hint">Check it, then save. You can go back to any step to change it.</p>
            </div>
          }
        }
      </div>

      <ng-template #footer>
        <div class="w-foot">
          @if (error()) { <div class="foot-msg"><p-message severity="error" size="small">{{ error() }}</p-message></div> }
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="open.set(false)" />
          @if (step() > 0) { <p-button label="Back" icon="pi pi-arrow-left" [outlined]="true" (onClick)="back()" /> }
          @if (step() < 3) {
            <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="next()" />
          } @else {
            <p-button [label]="editingId() ? 'Save changes' : 'Save experience'" icon="pi pi-check" [loading]="busy()" (onClick)="save()" />
          }
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .x-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .x-head h2 { margin: 0; }
    .totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0 18px; }
    .totals > div { border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; background: var(--soft); display: grid; gap: 2px; }
    .totals span { font-size: .78rem; color: var(--muted); }
    .totals b { font-size: 1.05rem; color: var(--pine); }
    .totals .total { background: color-mix(in srgb, var(--brass) 10%, #fff); border-color: color-mix(in srgb, var(--brass) 30%, transparent); }
    .totals .total b { color: var(--brass-dark); }
    .timeline { list-style: none; margin: 0; padding: 0 0 0 22px; position: relative; display: grid; gap: 14px; }
    .timeline::before { content: ''; position: absolute; left: 6px; top: 6px; bottom: 6px; width: 2px; background: var(--line); }
    .job { position: relative; }
    .dot { position: absolute; left: -22px; top: 14px; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid var(--brass); }
    .dot.now { background: var(--brass); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brass) 20%, transparent); }
    .j-card { border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; background: #fff; box-shadow: 0 2px 8px rgba(42, 31, 107, .05); }
    .j-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    h3 { margin: 0; font-size: 1.02rem; color: var(--pine); }
    .j-co { margin: 2px 0 0; font-weight: 600; font-size: .9rem; }
    .sep { margin: 0 6px; color: var(--muted); font-weight: 400; }
    .j-dates { margin: 4px 0 0; font-size: .84rem; color: var(--muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pill { font-size: .74rem; border-radius: 999px; padding: 1px 8px; background: var(--soft); color: var(--pine); font-weight: 600; }
    .pill.now { background: #e3f6ea; color: #127a3c; }
    .j-text { margin: 8px 0 0; font-size: .9rem; white-space: pre-line; overflow-wrap: anywhere; }
    .j-reason { margin: 8px 0 0; font-size: .82rem; color: var(--muted); }
    .tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .tools span { font-size: .76rem; border: 1px solid color-mix(in srgb, var(--brass) 35%, transparent); color: var(--brass-dark); border-radius: 999px; padding: 1px 9px; }
    .j-actions { display: inline-flex; gap: 2px; flex: none; }
    .icon { border: 0; background: none; width: 30px; height: 30px; border-radius: 8px; color: var(--muted); cursor: pointer; display: grid; place-items: center; }
    .icon:hover { background: rgba(0, 0, 0, .05); color: var(--brass-dark); }
    .icon.danger:hover { color: var(--required); }
    .icon:focus-visible { outline: 2px solid var(--brass); }
    .x-empty { margin: 4px 0 0; color: var(--muted); font-size: .9rem; }
    /* the wizard */
    .steps { list-style: none; margin: 0 0 18px; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; counter-reset: s; }
    .steps li { position: relative; }
    .steps button { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 6px; border: 0; background: none; padding: 4px 2px;
      cursor: pointer; color: var(--muted); font: 500 .8rem var(--body); }
    .steps button:disabled { cursor: default; }
    .steps li:not(:last-child)::after { content: ''; position: absolute; top: 18px; left: calc(50% + 20px); right: calc(-50% + 20px); height: 2px; background: var(--line); }
    .steps li.done:not(:last-child)::after { background: var(--brass); }
    .steps .n { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--line); background: #fff; font-weight: 700; }
    .steps li.on .n { border-color: var(--brass); color: var(--brass-dark); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brass) 15%, transparent); }
    .steps li.on .t { color: var(--pine); font-weight: 700; }
    .steps li.done .n { background: var(--brass); border-color: var(--brass); color: #fff; }
    .steps .t { text-align: center; line-height: 1.2; }
    .panel { min-height: 230px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; }
    .grid .span { grid-column: 1 / -1; }
    :host ::ng-deep .grid .p-datepicker { width: 100%; }
    .check { flex-direction: row; align-items: center; gap: 8px; display: flex; }
    .check label { font-weight: 500; }
    .opt { font-weight: 400; color: var(--muted); }
    .err { color: var(--required); font-size: .8rem; }
    .count { color: var(--muted); font-size: .75rem; text-align: right; }
    .hint { margin: 0; font-size: .84rem; color: var(--muted); }
    .review { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--soft); }
    .review dl { margin: 12px 0; display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 6px 12px; font-size: .9rem; }
    .review dt { color: var(--muted); }
    .review dd { margin: 0; white-space: pre-line; overflow-wrap: anywhere; }
    .w-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; width: 100%; }
    .foot-msg { flex: 1 1 260px; min-width: 0; text-align: left; }
    @media (max-width: 640px) {
      .totals { grid-template-columns: minmax(0, 1fr); }
      .grid { grid-template-columns: minmax(0, 1fr); }
      .steps .t { font-size: .7rem; }
      .review dl { grid-template-columns: minmax(0, 1fr); }
    }
  `,
})
export class ExperienceCard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(MessageService);
  private readonly confirmer = inject(ConfirmationService);

  /** Someone else's record (read-only); empty = my own profile. */
  readonly employeeId = input<number | null>(null);
  /** The company's name for the totals ("Before Acme…"); empty = "this company". */
  readonly companyName = input<string | null>(null);
  protected readonly mine = computed(() => this.employeeId() == null);
  protected readonly company = computed(() => this.companyName() || 'this company');

  protected readonly types = TYPES;
  protected readonly steps = STEPS;
  protected readonly today = new Date();
  protected readonly data = signal<Experience | null>(null);

  // ---- the wizard ----
  protected readonly open = signal(false);
  protected readonly step = signal(0);
  /** The furthest step reached: the steps up to it can be clicked. */
  protected readonly furthest = signal(0);
  protected readonly editingId = signal<number | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly fe = signal<Record<string, string>>({});
  protected readonly f = {
    companyName: signal(''), jobTitle: signal(''), employmentType: signal<EmploymentType>('FULL_TIME'), location: signal(''),
    start: signal<Date | null>(null), end: signal<Date | null>(null), current: signal(false), reasonForLeaving: signal(''),
    responsibilities: signal(''), achievements: signal(''), tools: signal(''),
  };
  /** Months of the job being typed, both counted. */
  protected readonly wizardMonths = computed(() => {
    const s = this.f.start();
    const e = this.f.current() ? this.today : this.f.end();
    if (!s || !e) return 0;
    const n = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth() + 1;
    return n > 0 ? n : 0;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const id = this.employeeId();
    const url = id == null ? `${API_BASE}/api/me/experience` : `${API_BASE}/api/employees/${id}/experience`;
    this.http.get<Experience>(url).subscribe({ next: (d) => this.data.set(d), error: () => undefined });
  }

  protected openAdd(): void {
    this.editingId.set(null);
    this.fill(null);
    this.open.set(true);
  }

  protected openEdit(j: Job): void {
    this.editingId.set(j.id);
    this.fill(j);
    this.furthest.set(3);
    this.open.set(true);
  }

  private fill(j: Job | null): void {
    this.f.companyName.set(j?.companyName ?? '');
    this.f.jobTitle.set(j?.jobTitle ?? '');
    this.f.employmentType.set(j?.employmentType ?? 'FULL_TIME');
    this.f.location.set(j?.location ?? '');
    this.f.start.set(j ? monthDate(j.startMonth) : null);
    this.f.end.set(j?.endMonth ? monthDate(j.endMonth) : null);
    this.f.current.set(!!j?.current);
    this.f.reasonForLeaving.set(j?.reasonForLeaving ?? '');
    this.f.responsibilities.set(j?.responsibilities ?? '');
    this.f.achievements.set(j?.achievements ?? '');
    this.f.tools.set(j?.tools ?? '');
    this.step.set(0);
    this.furthest.set(0);
    this.error.set('');
    this.fe.set({});
  }

  protected setCurrent(on: boolean): void {
    this.f.current.set(on);
    if (on) this.f.end.set(null);
  }

  /** The step's own checks; null when it may be left. */
  private problems(step: number): Record<string, string> {
    const p: Record<string, string> = {};
    if (step === 0) {
      if (!this.f.companyName().trim()) p['companyName'] = "Give the company's name";
      if (!this.f.jobTitle().trim()) p['jobTitle'] = 'Give the job title';
    }
    if (step === 1) {
      const s = this.f.start();
      const e = this.f.end();
      if (!s) p['startMonth'] = 'Choose the month you started';
      if (!this.f.current() && !e) p['endMonth'] = 'Choose the month you left, or tick "I still work here"';
      if (s && e && !this.f.current() && e < s) p['endMonth'] = 'The month you left is before the month you started';
    }
    return p;
  }

  protected next(): void {
    const p = this.problems(this.step());
    this.fe.set(p);
    if (Object.keys(p).length) {
      this.error.set('Fill in the marked fields to go on.');
      return;
    }
    this.error.set('');
    const n = this.step() + 1;
    this.step.set(n);
    this.furthest.set(Math.max(this.furthest(), n));
  }

  protected back(): void {
    this.error.set('');
    this.step.set(Math.max(0, this.step() - 1));
  }

  /** Back to any step reached; forward only through the checks. */
  protected goTo(i: number): void {
    if (i > this.furthest()) return;
    if (i > this.step()) {
      for (let s = this.step(); s < i; s++) {
        const p = this.problems(s);
        if (Object.keys(p).length) {
          this.fe.set(p);
          this.step.set(s);
          this.error.set('Fill in the marked fields to go on.');
          return;
        }
      }
    }
    this.error.set('');
    this.step.set(i);
  }

  protected save(): void {
    this.busy.set(true);
    this.error.set('');
    const body = {
      companyName: this.f.companyName().trim(), jobTitle: this.f.jobTitle().trim(), employmentType: this.f.employmentType(),
      location: this.f.location().trim() || null, startMonth: toIsoDate(this.f.start()),
      endMonth: this.f.current() ? null : toIsoDate(this.f.end()), responsibilities: this.f.responsibilities().trim() || null,
      achievements: this.f.achievements().trim() || null, tools: this.f.tools().trim() || null,
      reasonForLeaving: this.f.current() ? null : this.f.reasonForLeaving().trim() || null,
    };
    const id = this.editingId();
    const req = id ? this.http.put<Job>(`${API_BASE}/api/me/experience/${id}`, body) : this.http.post<Job>(`${API_BASE}/api/me/experience`, body);
    req.subscribe({
      next: (j) => {
        this.busy.set(false);
        this.open.set(false);
        this.toast.add({ severity: 'success', summary: id ? 'Experience saved' : 'Experience added', detail: `${j.jobTitle} at ${j.companyName}` });
        this.load();
      },
      error: (e) => {
        this.busy.set(false);
        const p = apiProblem(e);
        this.fe.set(p.fields);
        this.error.set(Object.values(p.fields)[0] ?? p.message);
        // a field the server refused: back to its step
        const bad = Object.keys(p.fields)[0];
        const at = STEPS.findIndex((s) => s.fields.includes(bad));
        if (at >= 0) this.step.set(at);
      },
    });
  }

  protected remove(j: Job): void {
    this.confirmer.confirm({
      header: 'Delete experience', message: `Delete ${j.jobTitle} at ${j.companyName}?`, icon: 'pi pi-trash',
      acceptLabel: 'Delete', rejectLabel: 'Keep', acceptButtonProps: { severity: 'danger' }, rejectButtonProps: { outlined: true },
      accept: () => this.http.delete<void>(`${API_BASE}/api/me/experience/${j.id}`).subscribe({
        next: () => {
          this.toast.add({ severity: 'info', summary: 'Experience deleted', detail: `${j.jobTitle} at ${j.companyName}` });
          this.load();
        },
        error: (e) => this.toast.add({ severity: 'error', summary: 'Not deleted', detail: apiProblem(e).message }),
      }),
    });
  }

  // ---- showing ----

  protected typeLabel(t: EmploymentType): string {
    return TYPES.find((x) => x.value === t)?.label ?? t;
  }

  /** "2020-01-01" -> "Jan 2020". */
  protected month(iso: string | null): string {
    return iso ? this.monthOf(monthDate(iso)) : '';
  }

  protected monthOf(d: Date | null): string {
    return d ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
  }

  /** 51 -> "4 yrs 3 mos". */
  protected duration(months: number): string {
    if (!months) return '0 mos';
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y ? `${y} yr${y === 1 ? '' : 's'}` : '', m ? `${m} mo${m === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ');
  }

  protected toolList(tools: string): string[] {
    return tools.split(',').map((t) => t.trim()).filter(Boolean);
  }
}

/** "2020-01-01" as the 1st of that month, without time-zone shifts. */
function monthDate(iso: string): Date {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
