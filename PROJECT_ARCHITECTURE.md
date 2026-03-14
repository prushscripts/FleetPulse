# FleetPulse — Technical Architecture

This document is a technical overview for engineers and AI tools. It reflects the current codebase only.

---

## Frontend architecture

- **Framework:** Next.js 14 with App Router.
- **Route groups:**
  - `app/(marketing)/` — public and post-login marketing: `page.tsx` (landing), `login/`, `signup/`, `home/`.
  - `app/(dashboard)/dashboard/` — all authenticated dashboard routes: `page.tsx` (vehicle grid), `vehicles/[id]/`, `vehicles/new/`, `drivers/`, `inspections/`, `about/`, `roadmap/`, `control-panel/`, `control-panel/template-builder/`, `settings/`, `admin/`, `welcome/`, `activate/`.
- **Rendering:** Mix of Server Components (pages that fetch user and pass `companyId` or data) and Client Components (`*Client.tsx` for forms, state, and Supabase client access). Layouts are server-rendered; dashboard layout reads `user.user_metadata.company_id` and passes it to children.
- **UI:** Tailwind CSS. Global styles and keyframes in `app/globals.css`. Theme (dark/light) in `components/layout/ThemeProvider.tsx`; route and page transitions in `components/animations/` (e.g. `RouteTransition`, `PageTransition`, `TabSlideTransition`).
- **Navigation:** `components/layout/Navbar.tsx` (logic) and `components/NavbarView.tsx` (UI). Nav items and visibility can be driven by company config (`enabled_tabs`, `custom_tab_labels`, `inspections_enabled`, `roadmap_only`) and admin status.

---

## Backend / API architecture

- **API routes:** Next.js Route Handlers under `app/api/`.
  - `GET /api/company-config` — reads `company_id` from query; uses Supabase admin client to fetch company row; returns JSON. Used by frontend for navbar and control panel.
  - `POST /api/update-company-config` — body: `company_id` and config fields; updates `companies` table (admin client).
  - `GET /api/companies-for-email` — returns companies for a given email (internal).
- **Server-side data:** No separate backend service. All data access is via Supabase from:
  - Server Components / Route Handlers: `createClient()` from `lib/supabase/server.ts` (cookies) or `createAdminClient()` from `lib/supabase/admin.ts` (service role, server-only).
  - Client components: `createClient()` from `lib/supabase/client.ts`.
- **No BFF layer:** Frontend calls Supabase directly from the client for most mutations and queries; API routes are used for company config and any logic that must use the service role.

---

## Authentication flow

1. **Signup:** `app/(marketing)/signup/page.tsx` — Supabase `signUp`; optional company invite code: lookup `companies` by `auth_key`, then `updateUser` with `company_id`, `company_name`, and `companies` list.
2. **Login:** `app/(marketing)/login/page.tsx` — Supabase `signInWithPassword`; optional company selection to set `company_id`/`company_name` in metadata.
3. **Session:** Supabase Auth stores session in cookies. `middleware.ts` calls `lib/supabase/middleware.ts` → `createServerClient` (cookie read/write) and `getUser()`. Unauthenticated users (except `/`, `/login`, `/signup`) are redirected to `/login`.
4. **Server components:** Use `createClient()` from `lib/supabase/server.ts` (same cookie store) and `getUser()` to get `user` and `user_metadata.company_id` for tenant scoping.
5. **Activate:** `/dashboard/activate` — user enters company key; lookup by `auth_key`; `updateUser` to add company to `companies` list and set `company_id`/`company_name`.
6. **Company switch:** Navbar calls `supabase.auth.updateUser({ data: { company_id, company_name } })` then redirects (e.g. `/home` or `/dashboard/roadmap` for roadmap-only companies).

---

## Multi-tenant data model and tenant separation

- **Table `companies`:** `id` (UUID), `name`, `auth_key` (unique), `display_name`, `trial_ends_at`, and config columns (`enabled_tabs`, `custom_tab_labels`, `inspections_enabled`, `roadmap_only`, etc.). One row per tenant.
- **Tenant identifier:** `company_id` (UUID) = `companies.id`. Stored on:
  - **vehicles** — `company_id` (nullable for legacy; new rows set by app).
  - **drivers** — `company_id` (nullable for legacy; new rows set by app).
- **User–company link:** No separate “user_company” table. Supabase `auth.users.user_metadata` holds:
  - `company_id`, `company_name` — current company.
  - `companies` — array of `{ id, name, displayName?, roadmapOnly? }` the user can switch to.
  - `company_settings` — optional per-company settings (e.g. custom template, inspections enabled) keyed by company id.
- **Queries:** Application code adds `.eq('company_id', companyId)` when fetching vehicles and drivers. `companyId` comes from `user.user_metadata.company_id`. RLS policies in Supabase may also enforce tenant isolation; see `supabase/companies-multi-tenant.sql` and other migration files.
- **Config per company:** Fetched via `/api/company-config?company_id=...` (service role) and cached on client. Control Panel and Settings write back via `/api/update-company-config`.

---

## Database / Supabase overview

- **Provider:** Supabase (PostgreSQL + Auth + Storage).
- **Core tables:** `vehicles`, `fuel_logs`, `service_records`, `issues`, `documents` (see `supabase/schema.sql`). Extended with `status`, `driver_id` on vehicles; `drivers`; `inspections`; `companies` and `company_id` on vehicles/drivers (see `supabase/schema-updates.sql`, `supabase/companies-multi-tenant.sql`, and other migrations).
- **Migrations:** Multiple SQL files in `supabase/` (e.g. `add-company-config-columns.sql`, `add-company-trial-and-settings.sql`, `storage-company-logos.sql`, `voyager-integration.sql`). Apply in order as needed; no single “migrate” script in repo.
- **RLS:** Enabled on main tables; policies in schema files typically allow `authenticated` to SELECT/INSERT/UPDATE/DELETE. Tenant isolation may be enforced in DB via RLS or only in app logic; verify per table.
- **Storage:** Bucket `vehicle-documents` for document uploads. Company logos can be stored in Supabase or served from `public/company-logos` (app uses public path for navbar logos).

---

## Major directories and what they do

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router: routes, layouts, API routes. `(marketing)` and `(dashboard)` route groups. |
| `app/api/` | Route Handlers: company-config, update-company-config, companies-for-email. |
| `components/` | React components: `layout/` (Navbar, ThemeProvider), `animations/` (transitions, scroll effects), `marketing/` (landing, login card, feature cards), `ui/` (e.g. CustomCheckbox). NavbarView at root. |
| `lib/` | Shared logic: `supabase/` (client, server, middleware, admin), `tiers.ts`, `user-utils.ts`, `custom-template.ts`. |
| `supabase/` | SQL schema and migrations; no Supabase CLI config in repo. |
| `scripts/` | Node scripts: `imports/` (import-fleetio, import-voyager-mileage), `integrations/` (Voyager analysis), `utils/` (OG image, poster). |
| `hooks/` | Empty (`.gitkeep` only). |
| `context/` | Empty (`.gitkeep` only). |
| `types/` | Empty (`.gitkeep` only). Types are often co-located in components or `lib`. |
| `data/` | CSV and other input data for scripts. |
| `reports/` | Report files (e.g. for Voyager import). |
| `docs/` | Product, deployment, prompts, ai, internal docs. |

---

## Important shared utilities, hooks, contexts, and types

- **Supabase:** `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server, cookies), `lib/supabase/middleware.ts` (session refresh), `lib/supabase/admin.ts` (service role, server-only).
- **Tiers:** `lib/tiers.ts` — `SubscriptionTier`, `TIER_CONFIG`, `normalizeTier()`. Used for display and feature gating (e.g. vehicle limits, CSV import).
- **User:** `lib/user-utils.ts` — `getUserDisplayName()` (nickname or email).
- **Custom template:** `lib/custom-template.ts` — types and helpers for dashboard template (sections, layout, tabs). Stored in `user_metadata.company_settings[companyId].customTemplate`.
- **Contexts:** Theme in `components/layout/ThemeProvider.tsx`; page transition context in `components/animations/PageTransition.tsx`. No global “auth” or “company” context — company is read from `user.user_metadata` per page or passed as prop.
- **Types:** Company and config types appear in API routes, Navbar, Settings, and Control Panel (e.g. `CompanyConfigRow` in `app/api/company-config/route.ts`). No central `types/` module yet.

---

## Environment and config (from repo)

- **Files:** No `.env.example` in repo; `docs/deployment/ENV_TEMPLATE.md` documents variables.
- **Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (client + server).
  - `SUPABASE_SERVICE_ROLE_KEY` — Server-only; used by API routes and import scripts.
  - `NEXT_PUBLIC_SITE_URL` — Optional; e.g. for OG images (production).
- **Secrets:** `.env.local` for local dev; Vercel env vars for production. Never commit secrets.

---

## Deployment flow

1. **Vercel:** Repo connected to Vercel; push to main (or configured branch) triggers build and deploy. Next.js build runs; output is serverless/edge as per Next.js 14.
2. **Build:** `npm run build` (or Vercel’s default). No custom build step in repo.
3. **Supabase:** Same project for dev and prod; redirect URLs in Supabase Auth must include production origin (e.g. `https://your-domain.com/auth/callback` if using auth callback).
4. **Env:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (and optionally `NEXT_PUBLIC_SITE_URL`) in Vercel project settings.

---

## Technical risks / TODOs / missing pieces (from codebase)

- **company-config route:** Uses `request.url` in GET handler; can trigger “Dynamic server usage” / static generation bailout in Next.js. Acceptable for dynamic API; if you need static generation elsewhere, keep this route dynamic.
- **apple-icon route:** Prerender may fail (Invalid URL) depending on env or OG dependency; not critical for core app.
- **Inspections:** Table and list page exist; full create flow (checklist, photos, pass/fail) and inspection history are partially implemented or planned. See `docs/product/FEATURES_SUMMARY.md` and `NEXT_STEPS.md`.
- **RLS vs app-level tenant filtering:** Tenant isolation is applied in app code (`company_id` filter). Confirm RLS policies align with this (e.g. no cross-tenant read/write).
- **hooks/ and types/:** Largely empty; shared hooks or global types could be moved here as the app grows.
- **Import scripts:** Depend on `data/` and `reports/` paths and `.env.local` with `SUPABASE_SERVICE_ROLE_KEY`; document for new contributors.
