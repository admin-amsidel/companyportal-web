/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */

/** Who made this software: shown in the website, portal and customer-link footers. */
export const CREDITS = {
  owner: 'IANEL Technologies',
  year: 2026,
  /** "© 2026 IANEL Technologies" (with the current year once it is later). */
  get copyright(): string {
    const now = new Date().getFullYear();
    return `© ${now > this.year ? this.year + '–' + now : this.year} ${this.owner}`;
  },
  line: 'Designed & developed by IANEL Technologies',
};
