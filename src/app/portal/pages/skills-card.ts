/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { API_BASE } from '../portal.config';
import { apiProblem } from '../portal.models';

export interface Skill {
  id: number;
  name: string;
  note: string | null;
}

/**
 * The skills on a person's profile, as tiles: a name (Java, Spring Boot…) with an optional note under it.
 * Without employeeId: my own, which I add, change and remove; with it: that person's, read-only (their record).
 * While typing, the company's own skills and common ones are offered; a few show as quick-add chips.
 */
@Component({
  selector: 'app-skills-card',
  imports: [FormsModule, AutoCompleteModule, ButtonModule, MessageModule, TextareaModule],
  template: `
    <section class="p-card">
      <div class="s-head">
        <h2>{{ mine() ? 'My skills' : 'Skills' }}</h2>
        @if (mine() && !formOpen()) {
          <p-button label="Add a skill" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="openAdd()" />
        }
      </div>
      @if (mine()) {
        <p class="s-intro">What you are good at, for your manager and HR to see: tools, technologies, trades and languages. Add a note for experience, projects or certificates.</p>
      }

      @if (formOpen()) {
        <div class="s-form">
          <div class="pf">
            <label for="sk-name">Skill <span class="req">*</span></label>
            <p-autocomplete inputId="sk-name" [suggestions]="suggestions()" (completeMethod)="suggest($event.query)" [dropdown]="true"
                            [minLength]="0" [delay]="200" [forceSelection]="false" [maxlength]="60" appendTo="body" styleClass="s-auto"
                            placeholder="e.g. Java, Spring Boot, AutoCAD" [invalid]="!!error() && !name().trim()"
                            [ngModel]="name()" (ngModelChange)="name.set($event ?? '')" />
          </div>
          <div class="pf">
            <label for="sk-note">Note <span class="opt">(optional)</span></label>
            <textarea pTextarea id="sk-note" rows="2" maxlength="500" [autoResize]="true"
                      placeholder="e.g. 5 years; microservices for the order system; Oracle certified"
                      [ngModel]="note()" (ngModelChange)="note.set($event)"></textarea>
          </div>
          @if (!editingId() && quick().length) {
            <div class="quick" aria-label="Popular skills">
              <span class="quick-label">Popular:</span>
              @for (q of quick(); track q) {
                <button type="button" class="chip" (click)="name.set(q)">+ {{ q }}</button>
              }
            </div>
          }
          @if (error()) { <p-message severity="error" size="small" styleClass="s-msg">{{ error() }}</p-message> }
          <div class="s-actions">
            <p-button [label]="editingId() ? 'Save skill' : 'Add skill'" icon="pi pi-check" size="small" [loading]="busy()" (onClick)="save()" />
            <p-button label="Cancel" size="small" [text]="true" severity="secondary" [disabled]="busy()" (onClick)="closeForm()" />
          </div>
        </div>
      }

      @if (skills().length) {
        <ul class="tiles">
          @for (s of skills(); track s.id) {
            <li class="tile" [class.editing]="editingId() === s.id">
              <div class="t-top">
                <span class="t-name"><i class="pi pi-check-circle" aria-hidden="true"></i>{{ s.name }}</span>
                @if (mine()) {
                  <span class="t-actions">
                    <button type="button" class="icon" [attr.aria-label]="'Change ' + s.name" title="Change" (click)="openEdit(s)"><i class="pi pi-pencil"></i></button>
                    <button type="button" class="icon danger" [attr.aria-label]="'Remove ' + s.name" title="Remove" (click)="remove(s)"><i class="pi pi-times"></i></button>
                  </span>
                }
              </div>
              @if (s.note) { <p class="t-note">{{ s.note }}</p> }
            </li>
          }
        </ul>
      } @else if (loaded()) {
        <p class="s-empty">{{ mine() ? 'No skills listed yet. Add the first with Add a skill.' : 'No skills listed.' }}</p>
      }
    </section>
  `,
  styles: `
    .s-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .s-head h2 { margin: 0; }
    .s-intro { margin: 6px 0 14px; font-size: .88rem; color: var(--muted); }
    .s-form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 12px 16px; padding: 14px; margin-bottom: 16px;
      border: 1px solid var(--line); border-radius: 12px; background: var(--soft); }
    .s-form .quick, .s-form .s-actions, .s-form :is(p-message) { grid-column: 1 / -1; }
    :host ::ng-deep .s-auto, :host ::ng-deep .s-auto .p-autocomplete-input { width: 100%; }
    .opt { font-weight: 400; color: var(--muted); }
    .quick { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .quick-label { font-size: .8rem; color: var(--muted); margin-right: 2px; }
    .chip { border: 1px dashed color-mix(in srgb, var(--brass) 55%, transparent); background: #fff; color: var(--brass-dark);
      border-radius: 999px; padding: 3px 10px; font: 500 .8rem var(--body); cursor: pointer; }
    .chip:hover { background: color-mix(in srgb, var(--brass) 10%, #fff); }
    .chip:focus-visible { outline: 2px solid var(--brass); outline-offset: 1px; }
    .s-actions { display: flex; gap: 8px; }
    .tiles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
    .tile { border: 1px solid var(--line); border-left: 4px solid var(--brass); border-radius: 12px; padding: 10px 12px; background: #fff;
      box-shadow: 0 2px 8px rgba(42, 31, 107, .05); display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .tile.editing { border-color: var(--brass); background: color-mix(in srgb, var(--brass) 6%, #fff); }
    .t-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .t-name { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--pine); overflow-wrap: anywhere; }
    .t-name .pi { color: var(--brass); font-size: .9rem; }
    .t-note { margin: 0; font-size: .84rem; line-height: 1.45; color: var(--muted); white-space: pre-line; overflow-wrap: anywhere; }
    .t-actions { display: inline-flex; gap: 2px; flex: none; }
    .icon { border: 0; background: none; width: 28px; height: 28px; border-radius: 8px; color: var(--muted); cursor: pointer; display: grid; place-items: center; }
    .icon:hover { background: rgba(0, 0, 0, .05); color: var(--brass-dark); }
    .icon.danger:hover { color: var(--required); }
    .icon:focus-visible { outline: 2px solid var(--brass); }
    .s-empty { margin: 4px 0 0; color: var(--muted); font-size: .9rem; }
    @media (max-width: 640px) { .s-form { grid-template-columns: minmax(0, 1fr); } .tiles { grid-template-columns: minmax(0, 1fr); } }
  `,
})
export class SkillsCard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(MessageService);

  /** Someone else's record (read-only); empty = my own profile. */
  readonly employeeId = input<number | null>(null);
  protected readonly mine = computed(() => this.employeeId() == null);

  protected readonly skills = signal<Skill[]>([]);
  protected readonly loaded = signal(false);
  protected readonly suggestions = signal<string[]>([]);
  /** Quick-add chips: suggested skills I have not listed yet. */
  protected readonly quick = computed(() => {
    const have = new Set(this.skills().map((s) => s.name.toLowerCase()));
    return this.popular().filter((p) => !have.has(p.toLowerCase())).slice(0, 10);
  });
  private readonly popular = signal<string[]>([]);

  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly name = signal('');
  protected readonly note = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    const id = this.employeeId();
    const url = id == null ? `${API_BASE}/api/me/skills` : `${API_BASE}/api/employees/${id}/skills`;
    this.http.get<Skill[]>(url).subscribe({
      next: (list) => { this.skills.set(list); this.loaded.set(true); },
      error: () => this.loaded.set(true),
    });
  }

  protected suggest(q: string): void {
    this.http.get<string[]>(`${API_BASE}/api/skills/suggestions`, { params: { q: q ?? '' } })
      .subscribe({ next: (s) => this.suggestions.set(s), error: () => this.suggestions.set([]) });
  }

  protected openAdd(): void {
    this.editingId.set(null);
    this.name.set('');
    this.note.set('');
    this.error.set('');
    this.formOpen.set(true);
    if (!this.popular().length) {
      this.http.get<string[]>(`${API_BASE}/api/skills/suggestions`).subscribe({ next: (s) => this.popular.set(s), error: () => undefined });
    }
  }

  protected openEdit(s: Skill): void {
    this.editingId.set(s.id);
    this.name.set(s.name);
    this.note.set(s.note ?? '');
    this.error.set('');
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  protected save(): void {
    const name = (this.name() ?? '').trim();
    if (!name) return this.error.set('Give the skill, e.g. Java.');
    this.error.set('');
    this.busy.set(true);
    const body = { name, note: this.note().trim() || null };
    const id = this.editingId();
    const req = id ? this.http.put<Skill>(`${API_BASE}/api/me/skills/${id}`, body) : this.http.post<Skill>(`${API_BASE}/api/me/skills`, body);
    req.subscribe({
      next: (saved) => {
        this.busy.set(false);
        this.skills.update((list) => (id ? list.map((s) => (s.id === id ? saved : s)) : [...list, saved]));
        if (id) {
          this.closeForm();
          this.toast.add({ severity: 'success', summary: 'Skill saved', detail: saved.name });
        } else {
          // ready for the next one
          this.name.set('');
          this.note.set('');
          this.toast.add({ severity: 'success', summary: 'Skill added', detail: saved.name });
        }
      },
      error: (e) => {
        this.busy.set(false);
        const p = apiProblem(e);
        this.error.set(Object.values(p.fields)[0] ?? p.message);
      },
    });
  }

  protected remove(s: Skill): void {
    this.http.delete<void>(`${API_BASE}/api/me/skills/${s.id}`).subscribe({
      next: () => {
        this.skills.update((list) => list.filter((x) => x.id !== s.id));
        if (this.editingId() === s.id) this.closeForm();
        this.toast.add({ severity: 'info', summary: 'Skill removed', detail: s.name });
      },
      error: (e) => this.toast.add({ severity: 'error', summary: 'Not removed', detail: apiProblem(e).message }),
    });
  }
}
