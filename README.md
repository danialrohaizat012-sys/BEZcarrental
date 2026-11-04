# BEZ Car Rental — Demo Prototype

Car rental website and booking & fleet management system, built as an **independent sales prototype by BinaLab**.

> Not commissioned, affiliated with, or endorsed by BEZ Car Rental. All vehicles, prices, policies and business details are placeholders.

- **Plan / architecture:** [`docs/PLAN.md`](docs/PLAN.md)
- **Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Zod · Vitest · Supabase (Phase 4, local first)
- **Languages:** Bahasa Melayu (default, `/ms`) and English (`/en`)

## Status

| Phase | Status |
|---|---|
| 1. Planning | Done |
| 2. Public website | Done — homepage, catalogue, vehicle details, 4-step booking request, confirmation |
| 3. Admin system | **Done** — overview, bookings workflow, calendar, fleet, customers, finance, settings |
| 4. Integration (local Supabase) | Next |
| 5. QA | Planned |

## Project structure

```
src/
  app/[lang]/(site)/     public pages (home, vehicles, vehicles/[slug], book, book/confirmed/[ref], terms, privacy)
  app/[lang]/admin/      login + protected console (overview, bookings, calendar, fleet, customers, finance, settings)
  components/            ui, site chrome, vehicle, booking, search
  lib/
    data/                mock catalogue + fleet + repository (swapped for Supabase in Phase 4)
    booking/             zod schema, server actions (validate + re-price + availability), demo storage
    admin/               domain rules, demo seed, browser store, demo auth (signed cookie)
    i18n/                dictionaries (ms, en)
    pricing.ts           pricing engine shared by client estimate and server
    time.ts              Asia/Kuala_Lumpur helpers
tests/                   vitest unit tests (pricing, availability, admin domain rules)
```

## Demo notes

- All vehicles, prices, policies, testimonials and contact details are **placeholders** (`src/lib/data/catalog.ts`, `vehicles.ts`).
- Vehicle images are SVG illustrations until real photos are supplied; add them to `images` in `vehicles.ts`.
- Booking requests are validated and priced on the server but **not persisted** in Phase 2; the confirmation is kept in the visitor's browser.
- Set the verified WhatsApp number in `business.whatsappNumber` (until then the button opens WhatsApp's contact picker).

## Admin console

- URL: `/ms/admin` or `/en/admin` (demo login is shown on the sign-in page).
- Env vars (set in Vercel → Settings → Environment Variables):
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — demo credentials (defaults `admin@bez.demo` / `demo1234`)
  - `ADMIN_SESSION_SECRET` — **set a long random value** to sign session cookies
  - `ADMIN_SHOW_DEMO_CREDENTIALS=false` — hide the credentials hint on the login page
- Booking rules (status machine, conflict prevention, balances) live in `src/lib/admin/domain.ts` and are unit-tested.
- Demo data is stored in the browser (`localStorage`) and can be restored from **Settings → Reset demo data**. Requests submitted on the public site in the same browser appear in admin as *Pending*; once approved, the customer's confirmation page shows the new status.
- Phase 4 moves storage to Supabase (Postgres exclusion constraint, RLS, Supabase Auth) without changing the UI.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
npm test         # unit tests
```

## Deployment (Vercel)

Import this repository in Vercel. The framework preset is detected automatically as **Next.js**; no environment variables are required yet. Supabase keys will be added in Phase 4 for a dedicated demo project only.
