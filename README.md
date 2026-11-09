# companyportal-web

Company Portal web app (Angular 21 + PrimeNG): the public landing page, the staff sign-in, the employee portal and
product portal, and the customer project-tracking link. It talks to `companyportal-backend`.

| Path | What |
|---|---|
| `/` | Landing page that sells Company Portal, with a working sign-in card (`src/app/pages/landing`) |
| `/login` | Staff sign-in (user ID + PIN) |
| `/portal/**` | Employee and product portal (menus follow each person's access) |
| `/track/:code/:token` | A customer's read-only project progress link |

## Run locally

```bash
npm ci
npm start            # http://localhost:4200, calls the backend at http://localhost:8080
npm run build        # production build in dist/companyportal-web
```

## Before going live

- **Backend address**: `PRODUCTION_API` in `src/app/portal/portal.config.ts`, and `BACKEND_HEALTH` in
  `worker/index.js` (the Worker pings it every 10 minutes so a free Render backend stays awake).
- **Sales contact** on the landing page: `salesEmail`, `phone` and `website` in `src/app/data/product.config.ts`.
  The "Request a demo" button appears once `salesEmail` is set.
- **Backend CORS**: add this app's address to `CORS_ORIGINS` on the backend.

## Branding

- Logo: `public/brand/logo-mark.svg` (also `logo-mark-192.png` and `public/favicon.ico`).
- Landing illustration: `public/images/hero-team.webp`.
- Portal colours: the PrimeNG preset in `src/app/portal/portal-ui.ts` and the tokens at the top of
  `src/app/portal/portal.scss` (violet primary `#6a4bf0`).
- A brand's page on the portal home can be filled in through `BRAND_SITES` in
  `src/app/portal/brand-site/brand-sites.ts`; without an entry it shows the details from the Brands page.

## Deploy (Cloudflare Workers)

`wrangler deploy` builds the app (`npm run build`) and serves `dist/companyportal-web/browser` as a single-page app.
