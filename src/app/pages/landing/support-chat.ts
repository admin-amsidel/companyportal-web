/*
 * Copyright (c) 2026 AMSIDEL Technologies. All rights reserved.
 * Designed and developed by AMSIDEL Technologies.
 */
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild,
} from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';
import { PRODUCT, telHref } from '../../data/product.config';
import { PRODUCT_MODULES } from '../../data/product-modules';
import { SUPPORT_CHAT } from '../../data/support-chat.config';
import { API_BASE } from '../../portal/portal.config';
import { apiProblem } from '../../portal/portal.models';
import { Icon } from './icon';

type Flow = 'CALLBACK' | 'DEMO';
type Field = 'date' | 'time' | 'name' | 'phone' | 'email' | 'company';

/** Where the conversation is: choosing from the menu, answering one question of a flow, or checking before sending. */
type Step =
  | { kind: 'menu' }
  | { kind: 'ask'; flow: Flow; field: Field }
  | { kind: 'confirm'; flow: Flow }
  | { kind: 'sending'; flow: Flow };

interface Msg {
  from: 'bot' | 'me';
  lines: string[];
  points?: string[];
}

interface Chip {
  label: string;
  run: () => void;
  primary?: boolean;
}

interface Lead {
  name: string;
  phone: string;
  email: string;
  company: string;
  demoDate: string;
  demoTime: string;
}

/** The order each flow asks its questions in. */
const ORDER: Record<Flow, Field[]> = {
  CALLBACK: ['name', 'phone', 'email', 'company'],
  DEMO: ['date', 'time', 'name', 'phone', 'email', 'company'],
};

const PHONE = /^\+?[0-9][0-9 -]{6,18}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const blankLead = (): Lead => ({ name: '', phone: '', email: '', company: '', demoDate: '', demoTime: '' });

/**
 * The website's support chat (bottom right of the landing page). It answers only from support-chat.config.ts — the
 * features, pricing and the questions listed there — and takes call-back and demo requests, which go to
 * POST /api/public/enquiries for the sales team.
 */
@Component({
  selector: 'cp-support-chat',
  imports: [Icon],
  templateUrl: './support-chat.html',
  styleUrl: './support-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
})
export class SupportChat {
  protected readonly cfg = SUPPORT_CHAT;
  protected readonly product = PRODUCT;

  /** Without the staff portal's interceptors: no sign-in token, no full-page loader. */
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly destroyRef = inject(DestroyRef);

  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly open = signal(false);
  protected readonly typing = signal(false);
  protected readonly messages = signal<Msg[]>([]);
  protected readonly chips = signal<Chip[]>([]);
  protected readonly step = signal<Step>({ kind: 'menu' });
  /** Shown once on the launcher until the chat is first opened. */
  protected readonly nudge = signal(true);

  private lead: Lead = blankLead();
  /** What the visitor looked at (Pricing, a module, a question): sent with the request so sales know the interest. */
  private readonly topics = new Set<string>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** The input box for the current step. */
  protected readonly input = computed(() => {
    const s = this.step();
    if (s.kind === 'ask') {
      switch (s.field) {
        case 'name': return { type: 'text', placeholder: 'Your full name', auto: 'name', label: 'Your name' };
        case 'phone': return { type: 'tel', placeholder: 'Phone, e.g. +91 98470 12345', auto: 'tel', label: 'Phone number' };
        case 'email': return { type: 'email', placeholder: 'you@company.com', auto: 'email', label: 'Email address' };
        case 'company': return { type: 'text', placeholder: 'Company name (optional)', auto: 'organization', label: 'Company name' };
        case 'date': return { type: 'date', placeholder: '', auto: 'off', label: 'Demo date' };
        case 'time': return { type: 'time', placeholder: '', auto: 'off', label: 'Demo time' };
      }
    }
    return { type: 'text', placeholder: 'Type your question…', auto: 'off', label: 'Your message' };
  });

  protected readonly inputDisabled = computed(() => this.step().kind === 'sending' || this.step().kind === 'confirm');
  protected readonly minDate = isoDay(addDays(new Date(), 1));
  protected readonly maxDate = isoDay(addDays(new Date(), SUPPORT_CHAT.demoDaysAhead));

  constructor() {
    this.destroyRef.onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.nudge.set(false);
    if (this.messages().length === 0) this.mainMenu(this.cfg.greeting);
    this.focusField();
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Enter in the box, or the send button. */
  protected submit(event: Event): void {
    event.preventDefault();
    const el = this.field()?.nativeElement;
    if (!el || this.inputDisabled()) return;
    const value = el.value.trim();
    if (!value) return;
    el.value = '';
    const s = this.step();
    if (s.kind === 'ask') {
      this.answer(s.flow, s.field, value);
    } else {
      this.me(value);
      this.understand(value);
    }
  }

  // ---------------------------------------------------------------- menu and answers

  private mainMenu(lines: string[] = ['What else can I help you with?']): void {
    this.step.set({ kind: 'menu' });
    this.say(lines, undefined, this.menuChips());
  }

  private menuChips(): Chip[] {
    return [
      { label: 'Explore features', run: () => this.pick('Explore features', () => this.features()) },
      { label: 'Pricing & plans', run: () => this.pick('Pricing & plans', () => this.pricing()) },
      { label: 'Book a demo', run: () => this.pick('Book a demo', () => this.startFlow('DEMO')), primary: true },
      { label: 'Request a call back', run: () => this.pick('Request a call back', () => this.startFlow('CALLBACK')) },
      { label: 'Common questions', run: () => this.pick('Common questions', () => this.questions()) },
    ];
  }

  private afterAnswer(): Chip[] {
    return [
      { label: 'Book a demo', run: () => this.pick('Book a demo', () => this.startFlow('DEMO')), primary: true },
      { label: 'Request a call back', run: () => this.pick('Request a call back', () => this.startFlow('CALLBACK')) },
      { label: 'Main menu', run: () => this.pick('Main menu', () => this.mainMenu()) },
    ];
  }

  private features(): void {
    this.say(
      [`${this.product.name} brings ${PRODUCT_MODULES.length} modules together in one portal. Which one would you like to know about?`],
      undefined,
      [
        ...PRODUCT_MODULES.map((m) => ({ label: m.title, run: () => this.pick(m.title, () => this.module(m.title)) })),
        { label: 'Main menu', run: () => this.pick('Main menu', () => this.mainMenu()) },
      ],
    );
  }

  private module(title: string): void {
    const m = PRODUCT_MODULES.find((x) => x.title === title);
    if (!m) return;
    this.topics.add(m.title);
    this.say([`${m.title}: ${m.text}`], m.points, [
      { label: 'Another module', run: () => this.pick('Another module', () => this.features()) },
      { label: 'Pricing & plans', run: () => this.pick('Pricing & plans', () => this.pricing()) },
      ...this.afterAnswer(),
    ]);
  }

  private pricing(): void {
    this.topics.add('Pricing');
    this.say(this.cfg.pricing, undefined, [
      { label: 'Get a quote (call back)', run: () => this.pick('Get a quote', () => this.startFlow('CALLBACK')), primary: true },
      { label: 'Book a demo', run: () => this.pick('Book a demo', () => this.startFlow('DEMO')) },
      { label: 'Main menu', run: () => this.pick('Main menu', () => this.mainMenu()) },
    ]);
  }

  private questions(): void {
    this.say(['Here are the questions we get asked most. Tap one:'], undefined, [
      ...this.cfg.faqs.map((f) => ({ label: f.q, run: () => this.pick(f.q, () => this.faq(f.q)) })),
      { label: 'Main menu', run: () => this.pick('Main menu', () => this.mainMenu()) },
    ]);
  }

  private faq(q: string): void {
    const f = this.cfg.faqs.find((x) => x.q === q);
    if (!f) return;
    this.topics.add(f.q);
    this.say(f.a, undefined, [
      { label: 'Another question', run: () => this.pick('Another question', () => this.questions()) },
      ...this.afterAnswer(),
    ]);
  }

  /** Free text outside a flow: only the topics this chat knows; anything else gets the menu. */
  private understand(text: string): void {
    const t = text.toLowerCase();
    const has = (...words: string[]) => words.some((w) => new RegExp(`\\b${escapeRe(w)}`).test(t));
    if (has('demo', 'trial', 'presentation', 'walkthrough')) return this.startFlow('DEMO');
    if (has('price', 'pricing', 'cost', 'quote', 'plan', 'charge', 'fee', 'subscription', 'how much', 'rate')) return this.pricing();
    if (has('call', 'contact', 'callback', 'talk', 'speak', 'reach')) return this.startFlow('CALLBACK');

    let best: { q: string; score: number } | null = null;
    for (const f of this.cfg.faqs) {
      const score = f.keywords.filter((k) => has(k)).length;
      if (score > 0 && (!best || score > best.score)) best = { q: f.q, score };
    }
    if (best) return this.faq(best.q);

    const mod = PRODUCT_MODULES.find((m) =>
      [m.title, m.short, ...m.title.split(/\s*&\s*|\s+/)].some((w) => w.length > 3 && has(w.toLowerCase())));
    if (mod) return this.module(mod.title);
    if (has('feature', 'module', 'what can', 'what does')) return this.features();
    if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(t)) return this.mainMenu(['Hello! How can I help you today?']);

    this.mainMenu([
      'Sorry, I can only help with the topics below. For anything else, leave your number and our customer agent will contact you back.',
    ]);
  }

  // ---------------------------------------------------------------- call-back and demo

  private startFlow(flow: Flow): void {
    this.lead = blankLead();
    const intro =
      flow === 'DEMO'
        ? 'Great — let’s book a live demo with our team. Which day suits you?'
        : 'Sure — our customer agent will contact you back. First, may I have your name?';
    this.ask(flow, ORDER[flow][0], [intro]);
  }

  private ask(flow: Flow, field: Field, lines: string[]): void {
    this.step.set({ kind: 'ask', flow, field });
    const chips: Chip[] = [];
    if (field === 'date') {
      for (const d of nextWorkingDays(3)) {
        chips.push({ label: dayLabel(d), run: () => this.answer(flow, 'date', isoDay(d)) });
      }
    } else if (field === 'time') {
      for (const t of this.cfg.demoTimes) chips.push({ label: timeLabel(t), run: () => this.answer(flow, 'time', t) });
    } else if (field === 'company') {
      chips.push({ label: 'Skip', run: () => this.answer(flow, 'company', '') });
    }
    chips.push({ label: 'Cancel', run: () => this.pick('Cancel', () => this.mainMenu(['No problem. What else can I help you with?'])) });
    this.say(lines, undefined, chips);
    this.focusField();
  }

  /** One answer in a flow: checked, kept, and the next question (or the summary). */
  private answer(flow: Flow, field: Field, raw: string): void {
    const value = raw.trim();
    this.me(field === 'date' && value ? dayLabel(parseDay(value)) : field === 'time' && value ? timeLabel(value) : value || 'Skip');
    const problem = this.check(field, value);
    if (problem) {
      this.ask(flow, field, [problem]);
      return;
    }
    this.lead[fieldKey(field)] = field === 'phone' ? value.replace(/\s+/g, ' ') : value;

    const order = ORDER[flow];
    const next = order[order.indexOf(field) + 1];
    if (!next) {
      this.confirm(flow);
      return;
    }
    const first = this.lead.name.split(' ')[0];
    const prompts: Record<Field, string> = {
      date: 'Which day suits you?',
      time: `${dayLabel(parseDay(this.lead.demoDate))} — what time works for you? (India time, or type another time)`,
      name: 'May I have your name?',
      phone: `Thanks, ${first}! What’s the best phone number to reach you?`,
      email: 'And your email address?',
      company: 'Which company are you from? (optional)',
    };
    this.ask(flow, next, [prompts[next]]);
  }

  private check(field: Field, v: string): string | null {
    switch (field) {
      case 'name':
        return v.length >= 2 && v.length <= 80 ? null : 'Please type your name (2 to 80 letters).';
      case 'phone': {
        const digits = v.replace(/\D/g, '').length;
        return PHONE.test(v) && digits >= 7 && digits <= 15
          ? null
          : 'That doesn’t look like a phone number. Please type it with digits only, e.g. +91 98470 12345.';
      }
      case 'email':
        return EMAIL.test(v) && v.length <= 120 ? null : 'That doesn’t look like an email address. Please check it, e.g. name@company.com.';
      case 'company':
        return v.length <= 120 ? null : 'Please keep the company name under 120 letters.';
      case 'date': {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Please pick a date.';
        return v >= this.minDate && v <= this.maxDate
          ? null
          : `Please pick a day between tomorrow and ${dayLabel(parseDay(this.maxDate))}.`;
      }
      case 'time':
        return TIME.test(v) ? null : 'Please pick a time, or type it like 11:30.';
    }
  }

  private confirm(flow: Flow): void {
    this.step.set({ kind: 'confirm', flow });
    const l = this.lead;
    const points = [
      ...(flow === 'DEMO' ? [`Demo: ${this.when()}`] : []),
      `Name: ${l.name}`,
      `Phone: ${l.phone}`,
      `Email: ${l.email}`,
      ...(l.company ? [`Company: ${l.company}`] : []),
    ];
    this.say(['Please check your details:'], points, [
      { label: flow === 'DEMO' ? 'Confirm demo request' : 'Send my details', run: () => this.send(flow), primary: true },
      { label: 'Change details', run: () => this.pick('Change details', () => this.startFlow(flow)) },
      { label: 'Cancel', run: () => this.pick('Cancel', () => this.mainMenu(['No problem. What else can I help you with?'])) },
    ]);
  }

  private send(flow: Flow): void {
    this.me(flow === 'DEMO' ? 'Confirm demo request' : 'Send my details');
    this.chips.set([]);
    this.step.set({ kind: 'sending', flow });
    this.typing.set(true);
    const l = this.lead;
    const body = {
      kind: flow,
      name: l.name,
      phone: l.phone,
      email: l.email,
      company: l.company || null,
      message: [...this.topics].join('; ').slice(0, 500) || null,
      demoDate: flow === 'DEMO' ? l.demoDate : null,
      demoTime: flow === 'DEMO' ? l.demoTime : null,
      website: '',
    };
    this.http
      .post(`${API_BASE}/api/public/enquiries`, body)
      .pipe(
        // the server may be waking up (free hosting) or busy: try again a couple of times before giving up
        retry({
          count: 2,
          delay: (err, n) =>
            err instanceof HttpErrorResponse && (err.status === 0 || err.status === 502 || err.status === 503)
              ? timer(1500 * n)
              : throwError(() => err),
        }),
      )
      .subscribe({
        next: () => {
          this.typing.set(false);
          const first = l.name.split(' ')[0];
          const done = (flow === 'DEMO' ? this.cfg.demoDone : this.cfg.callbackDone)
            .replace('{name}', first)
            .replace('{when}', this.when());
          this.lead = blankLead();
          this.mainMenu([done, 'Is there anything else I can help you with?']);
        },
        error: (err) => {
          this.typing.set(false);
          const msg = err instanceof HttpErrorResponse && err.status === 429
            ? apiProblem(err).message
            : 'Sorry, I couldn’t send your details just now. Please try again in a moment.';
          this.step.set({ kind: 'confirm', flow });
          this.say(
            [msg, ...(this.product.phone ? [`You can also call us on ${this.product.phone}.`] : [])],
            undefined,
            [
              { label: 'Try again', run: () => this.send(flow), primary: true },
              { label: 'Main menu', run: () => this.pick('Main menu', () => this.mainMenu()) },
            ],
          );
        },
      });
  }

  private when(): string {
    return this.lead.demoDate ? `${dayLabel(parseDay(this.lead.demoDate))} at ${timeLabel(this.lead.demoTime)}` : '';
  }

  // ---------------------------------------------------------------- messages

  /** A chip pressed: shown as the visitor's message, then answered. */
  private pick(label: string, then: () => void): void {
    this.me(label);
    then();
  }

  private me(text: string): void {
    this.chips.set([]);
    this.messages.update((m) => [...m, { from: 'me', lines: [text] }]);
    this.scroll();
  }

  /** The bot's reply, after a short "typing" pause so it reads like a conversation. */
  private say(lines: string[], points: string[] | undefined, chips: Chip[]): void {
    this.chips.set([]);
    this.typing.set(true);
    this.scroll();
    this.timers.push(
      setTimeout(() => {
        this.typing.set(false);
        this.messages.update((m) => [...m, { from: 'bot', lines, points }]);
        this.chips.set(chips);
        this.scroll();
      }, 450),
    );
  }

  private scroll(): void {
    this.timers.push(
      setTimeout(() => {
        const el = this.log()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }),
    );
  }

  private focusField(): void {
    // not on phones: the keyboard would cover the answer
    if (window.matchMedia('(pointer: coarse)').matches) return;
    this.timers.push(setTimeout(() => this.field()?.nativeElement.focus(), 500));
  }

  protected readonly phoneHref = PRODUCT.phone ? telHref(PRODUCT.phone) : '';
}

function fieldKey(f: Field): keyof Lead {
  return f === 'date' ? 'demoDate' : f === 'time' ? 'demoTime' : f;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** yyyy-mm-dd in the visitor's own calendar. */
function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The next n days from tomorrow, without Sundays. */
function nextWorkingDays(n: number): Date[] {
  const out: Date[] = [];
  for (let i = 1; out.length < n; i++) {
    const d = addDays(new Date(), i);
    if (d.getDay() !== 0) out.push(d);
  }
  return out;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}
