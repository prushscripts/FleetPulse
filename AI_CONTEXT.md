# FleetPulse — AI Project Context

Use this file to give AI coding assistants a fast, accurate understanding of the FleetPulse product and codebase. Do not rely on generic fleet-management assumptions; the details below reflect what is actually implemented.

---

## Project name and type

- **Name:** FleetPulse  
- **Product type:** Multi-tenant fleet management SaaS (web application)  
- **Tagline / positioning:** Modern Fleet Management  

FleetPulse is built and operated by Prush Logistics Group LLC. The same company uses it for its own fleet and offers it to other fleets.

---

## What the platform does (plain English)

FleetPulse lets fleet managers and operations staff:

- **Track vehicles** — mileage, oil-change due mileage, status (active / out of service / in shop), and basic info (make, model, year, VIN, license plate).
- **Manage drivers** — CRUD, license/expiration, active/inactive, and assignment of drivers to vehicles.
- **Record maintenance** — service records (date, mileage, type, cost, provider) and fuel logs.
- **Track issues** — open / in progress / resolved, with priority (low, medium, high, critical).
- **Store documents** — uploads with expiration dates (e.g. registration, insurance); UI warns when expired.
- **View fleet health** — home dashboard with vehicle counts, oil-change status, inspection pass rate (when inspections are used), and status breakdown.
- **Customize per company** — company-level config: enabled nav tabs, custom tab labels, inspections on/off, roadmap-only mode, and optional custom dashboard template (sections, layout).

Multiple organizations (tenants) use the same deployment. Each tenant is a **company**; users belong to one or more companies and switch between them in the UI. Data is isolated by `company_id` on vehicles and drivers.

---

## Company token / tenant isolation

- **Companies table:** Each customer (tenant) is a row in `companies` with a unique **`auth_key`** (e.g. `prushlogisticsroadmap`, `WheelzUpAPD2026`). This is the “company authentication key” or “invite code.”
- **How users join a company:**
  - **Signup:** Optional “Company invite code” field; if they enter a valid `auth_key`, they are linked to that company and `user_metadata.company_id` / `company_name` and `companies` list are set.
  - **Existing users:** Settings → My Companies → “Add another company” → enter the key. They can then switch companies via the navbar company switcher.
  - **Activate page:** `/dashboard/activate` lets users enter a key to attach to a company (e.g. after email invite).
- **Tenant scoping:** Server-side logic reads `user.user_metadata.company_id` and filters:
  - **vehicles** and **drivers** by `company_id` where applicable.
  - Dashboard, home, drivers, vehicles (list and new), control panel, template builder, and inspections all use this `company_id` for queries.
- **Company config:** Stored in `companies` (e.g. `enabled_tabs`, `custom_tab_labels`, `inspections_enabled`, `roadmap_only`, `trial_ends_at`). Fetched via `/api/company-config?company_id=...` and cached in client/navbar. Control Panel and Settings persist company-level settings (including optional custom template in `user_metadata.company_settings[companyId]`).

Adding a new company is done in Supabase (SQL). See `docs/ADD_NEW_COMPANY.md` and `supabase/add-prush-logistics-company.sql` for the pattern.

---

## User roles

- **Authenticated user (default):** Can use dashboard, vehicles, drivers, inspections (if enabled), about, roadmap, control panel (if they have a company), settings, and home. Data is scoped by their current company.
- **Admin:** `user_metadata.is_admin === true`. Can access `/dashboard/admin` to view companies, copy `auth_key`, and manage company list. Admins still have a current company and see company-scoped data elsewhere.
- There are no separate “dispatcher” or “driver” roles in the codebase; differentiation is by company and by feature access (e.g. inspections, control panel) driven by company config and UI.

---

## Implemented features (from the codebase)

- **Auth:** Email/password signup and login (Supabase Auth). Middleware refreshes session and redirects unauthenticated users to `/login` (except `/`, `/login`, `/signup`).
- **Landing:** Marketing page at `/` with feature list and pricing (Starter / Professional / Enterprise).
- **Home dashboard:** `/home` — fleet health stats, oil % OK, inspection pass rate, vehicle counts by status, quick actions.
- **Main dashboard:** `/dashboard` — vehicle grid, search/sort, status filters (All, Active, Out of Service, In Shop), driver on card, CSV import, add vehicle. Vehicles and drivers are scoped by current company.
- **Vehicle detail:** `/dashboard/vehicles/[id]` — tabs: Details (edit vehicle, mileage, oil due, mileage history), Service, Issues, Documents. Edit supports status and driver assignment where wired.
- **Drivers:** `/dashboard/drivers` — full CRUD, license/expiration, active/inactive, company-scoped.
- **Inspections:** `/dashboard/inspections` — list page present; full inspection form (checklist, photos, pass/fail) and inspection history are partially implemented or planned (see `docs/product/FEATURES_SUMMARY.md` and `NEXT_STEPS.md`).
- **About:** `/dashboard/about` — about page and subscription tier display.
- **Roadmap:** `/dashboard/roadmap` — roadmap view; some companies can be “roadmap only” and get redirected here.
- **Control Panel:** `/dashboard/control-panel` — company config (tabs, labels, inspections, roadmap-only). Template Builder sub-page for custom dashboard layout (sections, tabs).
- **Settings:** `/dashboard/settings` — profile (nickname, tier), My Companies (add via key, set current, see auth_key for current company).
- **Admin:** `/dashboard/admin` — list companies, copy auth_key (admin only).
- **Activate:** `/dashboard/activate` — enter company key to attach to a company.
- **Welcome:** `/dashboard/welcome` — post-signup or first-time flow.
- **API routes:**  
  - `GET /api/company-config?company_id=...` — returns company row (used by navbar and control panel).  
  - `POST /api/update-company-config` — body `company_id` + config fields.  
  - `GET /api/companies-for-email` — returns companies for an email (internal use).
- **Multi-tenant:** Companies table, `company_id` on vehicles and drivers, `user_metadata.company_id` / `company_name` / `companies` / `company_settings`; navbar company switcher; all main data paths filter by current company.
- **Subscription tier:** `user_metadata.subscription_tier` (starter / professional / premium). Used for display and feature gating (e.g. vehicle limits, CSV import) via `lib/tiers.ts`.
- **Storage:** Supabase Storage bucket `vehicle-documents` for documents; company logos referenced from `public/company-logos` (and company logo URL in DB where used).

---

## Planned / obvious next steps (from repo docs)

- **Inspections:** Full inspection flow — create inspection with checklist (brakes, tires, lights, etc.), photos, pass/fail, driver; inspection list and history (see `docs/product/FEATURES_SUMMARY.md` and `NEXT_STEPS.md`).
- **Vehicle detail:** Ensure status dropdown and driver assignment are fully wired on vehicle edit and displayed everywhere needed.
- **Custom dashboards:** Template Builder and company-level custom template already partially implemented; further polish and more section types.

---

## Tech stack

- **Framework:** Next.js 14 (App Router)  
- **Language:** TypeScript  
- **Styling:** Tailwind CSS  
- **Database:** Supabase (PostgreSQL)  
- **Auth:** Supabase Auth (email/password)  
- **Storage:** Supabase Storage (e.g. vehicle-documents)  
- **Hosting:** Vercel  

---

## High-level app architecture

- **Routes:**  
  - `app/(marketing)/` — `/`, `/login`, `/signup`, `/home`.  
  - `app/(dashboard)/dashboard/` — all dashboard routes (vehicles, drivers, inspections, about, roadmap, control-panel, settings, admin, welcome, activate).  
  - `app/api/` — company-config, update-company-config, companies-for-email.
- **Auth:** Middleware (`middleware.ts` → `lib/supabase/middleware.ts`) runs on every request, refreshes Supabase session, redirects unauthenticated users to `/login` (except public routes above).
- **Data access:** Server components and server actions use `createClient()` from `lib/supabase/server.ts` (cookie-based). Pages read `user.user_metadata.company_id` and pass it to client or use it in server queries. Client components use `createClient()` from `lib/supabase/client.ts`.
- **Tenant isolation:** Application-level: every vehicle/driver query that is company-scoped adds `.eq('company_id', companyId)`. RLS may also be applied in Supabase; see `supabase/` SQL files.

---

## Where major logic lives

- **Auth/session:** `lib/supabase/middleware.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`.  
- **Company/tenant:** `app/api/company-config/route.ts`, `app/api/update-company-config/route.ts`, `components/layout/Navbar.tsx`, `app/(dashboard)/dashboard/settings/SettingsClient.tsx`, `app/(dashboard)/dashboard/activate/ActivateClient.tsx`, signup/login pages (company key handling).  
- **Vehicles/drivers/dashboard:** `app/(dashboard)/dashboard/DashboardClient.tsx`, `app/(dashboard)/dashboard/vehicles/`, `app/(dashboard)/dashboard/drivers/DriversClient.tsx`, `app/(marketing)/home/HomeDashboardClient.tsx`.  
- **Tiers/feature flags:** `lib/tiers.ts`; `user_metadata.subscription_tier` and company config (e.g. `inspections_enabled`, `enabled_tabs`) gate features.  
- **Custom template:** `lib/custom-template.ts`; persisted in `user_metadata.company_settings[companyId].customTemplate` and used by Control Panel / Template Builder.  
- **Database schema and migrations:** `supabase/schema.sql`, `supabase/schema-updates.sql`, `supabase/companies-multi-tenant.sql`, and other `supabase/*.sql` files.

---

## Deployment overview

- **Hosting:** Vercel. Connect repo; Vercel builds Next.js and deploys.  
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Optional: `NEXT_PUBLIC_SITE_URL` (e.g. for OG). See `docs/deployment/ENV_TEMPLATE.md`.  
- **Supabase:** Same project for dev and prod; configure redirect URLs in Supabase Auth for production domain.  
- **Scripts:** `npm run import-fleetio` and `npm run import-voyager` use `scripts/imports/` and read from `data/` and `reports/`; they require `.env.local` and service role key.

---

## What AI assistants should know before editing

1. **Do not change Supabase auth or RLS behavior** unless the task explicitly requires it.  
2. **Tenant isolation:** Any new feature that loads vehicles or drivers must respect `company_id` (read from `user.user_metadata.company_id` and filter queries).  
3. **Company config:** Tab visibility, labels, and inspections/roadmap flags come from `companies` and `/api/company-config`; don’t hardcode feature flags.  
4. **Navbar and company switcher:** `components/layout/Navbar.tsx` and `components/NavbarView.tsx`; switching company updates `user_metadata` and reloads or redirects.  
5. **Subscription tier:** Use `lib/tiers.ts` and `normalizeTier(user?.user_metadata?.subscription_tier)` for any tier-based logic.  
6. **File layout:** Components are under `components/layout/`, `components/animations/`, `components/marketing/`, `components/ui/`; app routes under `app/(marketing)/` and `app/(dashboard)/dashboard/`.  
7. **Docs:** Product/feature context: `docs/product/`. Deployment and env: `docs/deployment/`. Adding companies: `docs/ADD_NEW_COMPANY.md`.
