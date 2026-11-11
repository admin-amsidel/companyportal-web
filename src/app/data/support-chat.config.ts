/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */

/**
 * What the website's support chat says. The chat answers only from this file (no AI, nothing made up): edit the
 * texts, add or remove questions, and rebuild. Anything a visitor types that matches no keyword gets the main menu.
 */

export interface ChatFaq {
  /** The question as a button. */
  q: string;
  /** The answer; each string is one paragraph. */
  a: string[];
  /** Lower-case words that bring this answer up when typed (whole words or parts of them). */
  keywords: string[];
}

export const SUPPORT_CHAT = {
  botName: 'Portal Assistant',
  greeting: [
    'Hi there! 👋 I’m the Company Portal assistant.',
    'I can tell you about our features and pricing, arrange a call back from our team, or book a live demo.',
  ],

  /** Shown for "Pricing & plans". TODO (sales): replace with your actual plans and prices. */
  pricing: [
    'Company Portal is priced per company, based on the number of employees and the modules you switch on — so you only pay for what you use.',
    'Hosting, updates, backups and support are included in the subscription, and there is nothing to install.',
    'Share your contact details and our customer agent will send you a quote for your team size.',
  ],

  /** Times offered for a demo (India time). The visitor can also type another time. */
  demoTimes: ['10:00', '11:30', '14:00', '15:30', '17:00'],
  /** How far ahead a demo can be booked. */
  demoDaysAhead: 60,

  callbackDone: 'Thank you, {name}! Our customer agent will contact you back shortly.',
  demoDone: 'Thank you, {name}! Your demo request for {when} is received. Our service team will contact you back to confirm.',

  faqs: [
    {
      q: 'Do I need to install anything?',
      a: ['No. Company Portal runs in the web browser on desktops, tablets and phones. Your team signs in with a user ID and PIN — nothing to download.'],
      keywords: ['install', 'download', 'browser', 'software'],
    },
    {
      q: 'Does it work on mobile phones?',
      a: ['Yes — it is built mobile-first. Staff can check in with a selfie and GPS, apply for leave, log work and scan stock QR labels from any phone browser.'],
      keywords: ['mobile', 'phone app', 'android', 'iphone', 'ios', 'tablet'],
    },
    {
      q: 'Can we manage more than one company or brand?',
      a: ['Yes. You can run several companies or brands from one portal, each with its own logo, colours, mail settings and work rules.'],
      keywords: ['brand', 'multiple compan', 'more than one', 'branch', 'multi'],
    },
    {
      q: 'Is our data secure?',
      a: [
        'Security is on from day one: PIN rules, lock-out after repeated wrong attempts, sessions that expire, and role- and menu-based permissions checked on every request.',
        'Your data is stored in a managed cloud database with encrypted connections.',
      ],
      keywords: ['secur', 'safe', 'data', 'privacy', 'password'],
    },
    {
      q: 'Can we choose only the modules we need?',
      a: ['Yes. Start with the modules you need today and switch on more as you grow. You also decide which menus each role, designation or person can see.'],
      keywords: ['choose', 'select', 'customi', 'which module', 'pick'],
    },
    {
      q: 'How long does it take to get started?',
      a: ['Most companies are live within a few days: we set up your company and roles, help import your employees, and each person gets a user ID and PIN.'],
      keywords: ['how long', 'setup', 'set up', 'start', 'onboard', 'implement', 'go live'],
    },
    {
      q: 'Can you import our existing employee data?',
      a: ['Yes. Send us your employee list in Excel and we help bring it into the portal, so you don’t have to type everyone in again.'],
      keywords: ['import', 'excel', 'existing', 'migrat', 'upload', 'spreadsheet'],
    },
  ] satisfies ChatFaq[],
};
