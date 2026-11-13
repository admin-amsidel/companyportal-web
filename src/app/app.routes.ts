/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { Routes } from '@angular/router';
import { providePortalUi } from './portal/portal-ui';

export const routes: Routes = [
  {
    // the product's public page: what Peopiq does, with a sign-in card
    path: '',
    pathMatch: 'full',
    title: 'Peopiq · People. Operations. Business. Connected.',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
  },
  // a customer's project status link: no sign-in, outside the portal
  {
    path: 'track/:code/:token',
    title: 'Project progress',
    // the PrimeNG theme, as in the portal (but nothing of the portal itself)
    providers: [providePortalUi()],
    loadComponent: () => import('./pages/track/track').then((m) => m.Track),
  },
  // Staff portal; its own chunks, so the landing page never loads it
  { path: 'login', loadChildren: () => import('./portal/portal.routes').then((m) => m.LOGIN_ROUTES) },
  { path: 'portal', loadChildren: () => import('./portal/portal.routes').then((m) => m.PORTAL_ROUTES) },
  { path: '**', redirectTo: '' },
];
