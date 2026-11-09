/*
 * Copyright (c) 2026 AMSIDEL Technologies. All rights reserved.
 * Designed and developed by AMSIDEL Technologies.
 */
import { DOCUMENT } from '@angular/common';
import { EnvironmentProviders, inject, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { connectComboboxLabels } from './combobox-labels';

/**
 * PrimeNG in the staff portal's colours: violet shades on white (primary #6a4bf0), cool lavender-greys for surfaces and
 * dark grey / near-black for text, pill-shaped buttons. Light mode only.
 */
export const CompanyPortalPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f4f1ff',
      100: '#e9e4fe',
      200: '#d7cffd',
      300: '#b3a4fb',
      400: '#8b74f7',
      500: '#6a4bf0',
      600: '#5a3ad9',
      700: '#4a2fb5',
      800: '#3d2893',
      900: '#33247a',
      950: '#1f1550',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8f7fd',
          100: '#f1f0f8',
          200: '#e6e4f0',
          300: '#c9d5e2',
          400: '#9aa9ba',
          500: '#6f7e90',
          600: '#536172',
          700: '#3e4a58',
          800: '#2b3440',
          900: '#1f2630',
          950: '#141a22',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
    },
  },
  components: {
    button: { root: { borderRadius: '2rem' } },
  },
});

let configured = false;

/**
 * Route-level setup for the staff portal (login + /portal), so the public website never loads PrimeNG.
 * providePrimeNG() only applies at app start, so the theme is set when these routes are first opened.
 */
export function providePortalUi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    MessageService,
    ConfirmationService,
    provideEnvironmentInitializer(() => {
      if (configured) return;
      configured = true;
      inject(PrimeNG).setConfig({
        ripple: true,
        theme: { preset: CompanyPortalPreset, options: { darkModeSelector: false, cssLayer: false } },
        // <p-button> leaves its icon span readable, so the icon font's character (drawn by ::before) became part of
        // the button's name, e.g. "\ue9xx APPLY". The icon is decoration: the label, or ariaLabel on an icon-only
        // button, names it. (The pButton directive already hides its icon.)
        pt: { button: { icon: { 'aria-hidden': 'true' } } },
      });
      // the labels of dropdowns name them and focus them (PrimeNG's Select is a span, which <label for> cannot label)
      connectComboboxLabels(inject(DOCUMENT));
    }),
  ]);
}
