# BEZ Car Rental — Phase 1 Plan

> Independent sales prototype by **BinaLab**. Not commissioned, affiliated with, or endorsed by BEZ Car Rental.
> All vehicles, prices, policies, testimonials and business details are placeholders until verified.

Status: **Draft for review.** Nothing in §5 is created in a database until this architecture is approved.

---

## 1. Project understanding

- **Goal:** win BEZ Car Rental (Pengkalan Chepa, Kota Bharu, Kelantan) as a client by demonstrating one system that runs the whole rental business — customers browse, check availability and request a booking; staff approve, hand over, track, take payments, manage fleet and see everything on a calendar.
- **Constraints:** placeholder data, clearly labelled; no real payments; no identity documents; isolated demo environment (never another client's database or credentials); conflict rules enforced in the database; MYR; `Asia/Kuala_Lumpur`; resettable demo.
- **Bar:** feels like a finished automotive product; mobile-first (most customers arrive via WhatsApp/Facebook on a phone).

## 2. System architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | SSR/SEO public pages and admin in one codebase |
| Styling | Tailwind CSS + own component library (Radix primitives for a11y) | Distinctive look, not a stock template |
| Data / Auth / Files | Supabase — Postgres, Auth, Storage, RLS | Booking integrity in Postgres (constraints + functions) |
| Server logic | Postgres RPC functions for booking mutations; Server Actions for admin forms | Browser never writes booking tables directly |
| Validation | Zod schemas shared client/server, plus DB constraints | Early UX errors, DB is the final authority |
| Time | `timestamptz` (UTC) stored, rendered in `Asia/Kuala_Lumpur` | Consistent across devices |
| Money | Integer **sen**, displayed `RM 1,234.00` | No float rounding |
| PWA | Manifest, installable admin, offline fallback | Staff add to home screen |
| Hosting | Vercel + a **new dedicated Supabase project `bez-demo`** | Fully isolated |
| Pre-approval | Local Supabase (CLI + Docker) with identical schema/seed | Build without any cloud account |

### Security model
- Customers book as **guests** in v1. Each booking returns a **reference + unguessable lookup token** (stored hashed); that link is the only way to view it. Anonymous users cannot read `bookings`/`customers`/`payments`.
- Public reads limited to catalogue, images, pricing, add-ons, locations and `is_public` settings. Availability via an RPC that returns **busy ranges only** (no PII).
- Staff use Supabase Auth (email + password, optional MFA); public sign-up disabled. Roles in `staff_profiles`; policies use `is_staff()` / `is_admin()`.
- Admin RPCs check role inside the database. Booking submission is rate-limited with a honeypot (Turnstile before go-live).

### Booking conflict prevention (database-enforced)
1. `bookings.rental_period tstzrange = [pickup_at, return_at + turnaround_buffer)`; buffer snapshotted on confirmation.
2. Exclusion constraint (`btree_gist`):
   `EXCLUDE USING gist (vehicle_id WITH =, rental_period WITH &&) WHERE (status IN ('confirmed','collected','active'))`
3. Maintenance/unavailable blocks live in `availability_blocks` (own exclusion constraint). A trigger locks the vehicle row (`SELECT … FOR UPDATE`) and checks both tables on insert/confirm/date change — concurrent approvals serialise; the loser gets a clear conflict error.
4. **Pending** requests may overlap each other but never a confirmed booking or a block. Approving one surfaces the now-conflicting pending requests to reject or reassign.

## 3. Page structure

### Public
| Route | Contents |
|---|---|
| `/` | Hero + search, featured vehicles, Why Choose Us, How It Works, demo testimonials (labelled), FAQ, footer, floating WhatsApp |
| `/vehicles` | Catalogue, filters (category, transmission, seats, price), date/time availability search |
| `/vehicles/[slug]` | Gallery, specs, rates, included features, conditions, availability calendar, sticky mobile CTA |
| `/book` | 4-step flow: vehicle & period → add-ons & price → details → review |
| `/book/confirmed/[ref]` | Reference, summary, status **Pending approval**, WhatsApp follow-up |
| `/booking/lookup` | Reference + phone, or secret link |
| `/terms`, `/privacy` | Placeholder rental terms; PDPA 2010 placeholder notice |

### Admin (`/admin`, staff only)
| Route | Contents |
|---|---|
| `/admin/login` | Staff sign-in |
| `/admin` | Counts by status, available vehicles, today's pickups/returns, upcoming returns, overdue, demo revenue |
| `/admin/bookings`, `/[id]` | Filter/search; status timeline, approve/reject, modify dates, assign vehicle, record payment, cancel, notes |
| `/admin/calendar` | Vehicle × time timeline: reserved, active, maintenance, pending; click to open, drag to block |
| `/admin/fleet`, `/[id]` | Add/edit, image upload & order, pricing, mark unavailable, maintenance, booking history, per-vehicle revenue |
| `/admin/customers`, `/[id]` | Profile, contact, bookings, payments, notes |
| `/admin/finance` | Charges, deposits, outstanding balances, refunds, payment history, CSV export |
| `/admin/settings` | Pricing rules, add-ons, deposits, booking rules, locations, business info, staff, **demo reset** |

## 4. Booking workflow

### Customer
1. **Select vehicle.**
2. **Rental period** — date + time (30-min steps, within opening hours). Validated: return > pickup, min lead time, min/max duration, live availability.
3. **Price** — one server-side `calculate_quote()` used for display and again on submit:
   - Duration = full 24 h days + remainder hours (1 h grace; extra hours at hourly rate, capped at one day).
   - Base = daily rate × days; weekly/monthly rates and seasonal rules (e.g. Hari Raya) apply automatically.
   - Add-ons: child seat, additional driver, extra cover, airport/hotel delivery.
   - **Estimated deposit** per category — shown separately, refundable, not part of the rental total.
   - Optional SST (setting, off by default).
4. **Details** — full name, mobile (Malaysian format), optional email, pickup location, notes. **No IC/licence/documents.**
5. **Confirmation** — reference (e.g. `BEZ-25K7QF`), vehicle, period, breakdown, status **Pending approval**. Never "confirmed" until an admin approves.

### Status machine
```
Pending ──approve──▶ Confirmed ──handover──▶ Vehicle Collected ──▶ Active Rental ──▶ Returned ──settle──▶ Completed
   │                     │
   ├──reject──▶ Rejected  └──cancel──▶ Cancelled      (Pending may also be cancelled)
```
Transitions enforced by a DB trigger and logged in `booking_status_history`. Settlement computes late/fuel/damage charges and the deposit refund.

## 5. Proposed database schema (not yet created)

| Table | Key columns | Relationships / constraints |
|---|---|---|
| `staff_profiles` | `id` (= `auth.users.id`), `full_name`, `role` (`admin`/`staff`), `active` | 1:1 auth user |
| `system_settings` | `key`, `value jsonb`, `is_public`, `updated_by` | Business info, booking rules, timezone, tax, WhatsApp |
| `locations` | `name`, `type` (`office`/`airport`/`delivery`), `fee_sen`, `active` | Pickup/return |
| `vehicle_categories` | `name`, `slug`, `sort`, `default_deposit_sen` | |
| `vehicles` | `category_id`, `make`, `model`, `variant`, `year`, `plate_no` unique, `transmission`, `seats`, `luggage`, `fuel`, `features text[]`, `status` (`active`/`unavailable`/`retired`), `slug`, `is_demo` | FK category |
| `vehicle_images` | `vehicle_id`, `storage_path`, `alt`, `sort`, `is_cover` | ≤ 1 cover per vehicle (partial unique index) |
| `pricing_rules` | `category_id` xor `vehicle_id`, `hourly_sen`, `daily_sen`, `weekly_sen`, `monthly_sen`, `valid_from`, `valid_to`, `priority` | Seasonal rules override base by priority |
| `add_ons` | `name`, `pricing` (`per_day`/`per_booking`), `price_sen`, `max_qty`, `active` | |
| `customers` | `full_name`, `phone_e164` unique, `email`, `notes`, `is_demo` | Repeat customers matched by phone |
| `bookings` | `ref` unique, `lookup_token_hash`, `customer_id`, `vehicle_id`, `pickup_location_id`, `return_location_id`, `pickup_at`, `return_at`, `rental_period tstzrange`, `status`, `quote jsonb`, `rental_total_sen`, `deposit_sen`, `source`, `is_demo` | `CHECK (return_at > pickup_at)`, exclusion constraint, status-transition trigger |
| `booking_add_ons` | `booking_id`, `add_on_id`, `qty`, `unit_price_sen`, `line_total_sen` | Price snapshot |
| `booking_status_history` | `booking_id`, `from_status`, `to_status`, `changed_by`, `reason`, `created_at` | Append-only (trigger) |
| `payments` | `booking_id`, `kind` (`rental`/`deposit`/`deposit_refund`/`refund`/`charge`), `method` (`cash`/`bank_transfer`/`duitnow`/`card_manual`), `amount_sen`, `reference`, `received_at`, `recorded_by` | **Manual records only — no gateway** |
| `booking_charges` | `booking_id`, `type` (`late`/`fuel`/`damage`/`cleaning`/`other`), `amount_sen`, `note` | Added at return |
| `availability_blocks` | `vehicle_id`, `period tstzrange`, `reason` (`maintenance`/`unavailable`/`hold`), `maintenance_id`, `created_by` | Exclusion per vehicle; checked against bookings by trigger |
| `maintenance_records` | `vehicle_id`, `type`, `description`, `odometer`, `cost_sen`, `vendor`, `opened_at`, `closed_at`, `status` | May create a block |
| `audit_log` | `actor`, `action`, `entity`, `entity_id`, `diff jsonb` | All admin mutations |

- **Balances:** view `booking_balances` = paid, outstanding, deposit held/refunded, refund status — derived from `payments` + `booking_charges`.
- **RLS:** anon → read-only on catalogue tables and public settings; everything else denied. Staff → full read/write except deleting history. Admin → settings and staff management.
- **Storage:** `vehicle-images` (public read, staff write); private `booking-files` reserved for future handover photos.
- **Demo reset:** admin-only `reset_demo()` deletes `is_demo` rows and re-seeds with dates relative to now; Settings button + optional nightly schedule.

## 6. UI/UX direction — "Showroom at dusk"

- **Palette:** Graphite `#111418`, Warm ivory `#F6F4EF`, Petrol teal `#0E4D57` (primary), Burnished amber `#C98A2E` (CTA/highlight only), steel greys. Reserved status colours, always paired with a label.
- **Type:** Manrope (display), Inter (body/data), tabular numerals.
- **Imagery:** warm, low-angle shots of Malaysian-market models on a consistent backdrop; licensed stock captioned "Representative image".
- **Motion:** 150–250 ms fades/lifts; reveal-on-scroll for section headings only; respects `prefers-reduced-motion`.
- **Mobile:** search in a bottom sheet, sticky price/CTA bar, thumb-friendly pickers; admin bottom tab bar, card lists instead of wide tables.
- **Components:** Button, StatusBadge, DateTimeRangePicker, VehicleCard, Gallery, PriceBreakdown, Stepper, DataTable/CardList, TimelineCalendar, Drawer, EmptyState, Skeleton, Toast, ConfirmDialog.
- **Demo honesty:** persistent "Demo prototype by BinaLab — not affiliated with BEZ Car Rental" ribbon; "Sample" tags on prices/testimonials; "Demo data" on dashboard figures.
- **Accessibility:** WCAG AA contrast, visible focus, fully keyboard-operable booking flow.

## 7. First demo scope

**Included:** all public pages; full booking request flow with live availability and server pricing; booking lookup; ~10 Malaysian-market demo models (Perodua Axia, Myvi, Bezza, Alza, Aruz; Proton Saga, X50, X70; Honda City; Toyota Vios, Innova, Hilux) at sample prices; admin overview; booking management with full status workflow, conflict warnings, date changes, vehicle reassignment, manual payments, cancellation; fleet with image upload and maintenance; timeline calendar; customers with notes; finance; settings; demo reset; demo admin login; tests for pricing, overlap, concurrent approval and RLS; Playwright E2E of both journeys at mobile and desktop sizes.

**Deferred:** real payment gateway (Billplz / ToyyibPay / iPay88), automated WhatsApp/email notifications (v1 uses `wa.me` links), customer accounts, document upload / e-KYC, digital agreements, BM translation (i18n-ready).

## 8. Open questions

### BinaLab
1. Approve creating a new Supabase project for the demo, or build against local Supabase first?
2. Vercel on a BinaLab demo subdomain with `noindex`?
3. English only, or English + Bahasa Melayu from the start?
4. Licensed stock photos (Unsplash/Pexels) or a BinaLab library?

### BEZ Car Rental
1. Business name, logo, address, hours, WhatsApp, service area.
2. Actual fleet — models, quantities, photos, plates (admin only).
3. Rates — hourly/daily/weekly/monthly, festive pricing, minimum rental.
4. Deposit amounts, method and refund timing.
5. Pickup/return options and fees (office, Sultan Ismail Petra Airport, hotel delivery).
6. Driver requirements — minimum age, licence tenure, documents checked at counter.
7. Policies — cancellation, late return, fuel, mileage, out-of-state travel, smoking/cleaning.
8. Current payment methods; interest in online payment later.
9. SST registration and invoice/receipt requirements.
10. Should a pending request temporarily hold the car?
11. Are "Vehicle Collected" and "Active Rental" distinct steps for them?
12. Number of staff and permission levels.
13. Current tools (WhatsApp, spreadsheets, notebook) and data to import.

## Delivery phases

1. **Planning** — this document *(in review)*
2. **Public website** — homepage, catalogue, details, booking UI on mock data
3. **Admin system** — dashboard, bookings, fleet, calendar, customers
4. **Integration** — Supabase schema, RLS, RPCs, conflict enforcement, auth
5. **QA** — functional, mobile, security, conflict testing, error handling, performance
