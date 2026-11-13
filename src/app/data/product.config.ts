/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */

/**
 * Who sells Peopiq, the product (made by IANEL Technologies), and how prospects reach them: shown on the landing page (/). Empty values are hidden,
 * so fill in only what should be public.
 */
export const PRODUCT = {
  name: 'Peopiq',
  tagline: 'People. Operations. Business. Connected.',
  vendor: 'IANEL Technologies',
  /** "Request a demo" and "Contact sales" open a mail to this address. */
  salesEmail: '',
  /** Shown in the support section; digits, spaces and + only. */
  phone: '',
  website: '',
} as const;

/** mailto: link with a subject (and optional body) filled in, or '' when no sales address is set. */
export function salesMailto(subject: string, body = ''): string {
  if (!PRODUCT.salesEmail) return '';
  const q = `subject=${encodeURIComponent(subject)}` + (body ? `&body=${encodeURIComponent(body)}` : '');
  return `mailto:${PRODUCT.salesEmail}?${q}`;
}

export function telHref(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '');
}
