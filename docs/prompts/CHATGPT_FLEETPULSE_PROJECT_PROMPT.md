# FleetPulse – Project Context Prompt for ChatGPT

**Copy everything below the line and paste it into your FleetPulse project in ChatGPT so it has full context.**

---

You are helping develop **FleetPulse**, a fleet management web application. Use this document as the source of truth for what the product is, what’s built, and what’s planned.

## What FleetPulse Is

- **Product:** FleetPulse is a **fleet management software platform** (web app). Tagline: **Modern Fleet Management.**
- **One-liner:** Track vehicles, drivers, maintenance, inspections, and documents in one place. Built for fleet managers and operations teams.
- **Company:** Prush Logistics Group LLC is the company behind FleetPulse. FleetPulse is the product; Prush Logistics is the delivery/logistics company that also offers this software. The same team builds and uses it.
- **Live product:** FleetPulseHQ.com (landing, login, signup, marketing). Contact: fleetpulse@fastmail.com (or @fleetpulse once email is set up).

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email + password)
- **Storage:** Supabase Storage (e.g. vehicle documents, inspection photos)
- **Hosting/Deploy:** Vercel

## What’s Already Built (Done)

- **Authentication:** Email/password signup and login via Supabase; protected routes; session handling.
- **Landing page:** Marketing site at `/` (when logged out) – features, pricing tiers (Starter $29, Professional $79, Enterprise $199), CTAs, dark mode.
- **Home dashboard:** `/home` – fleet health stats, oil change %, inspection pass rate, vehicle status breakdown (Active / Out of Service / In Shop), quick actions.
- **Main dashboard:** `/dashboard` – vehicle grid with search and sorting; status filters (All, Active, Out of Service, In Shop); vehicle cards with code, mileage, oil status, open issues, document expiration warnings; CSV import; “Add vehicle” flow.
- **Vehicle detail:** `/dashboard/vehicles/[id]` – tabs for Details, Service, Issues, Documents; edit vehicle info; update mileage and oil-change-due mileage; mileage history; service records; issue tracking (open → in_progress → resolved, with priority); document uploads with expiration tracking; status and driver assignment (where implemented).
- **Driver management:** `/dashboard/drivers` – full CRUD for drivers; license and expiration; assign drivers to vehicles; active/inactive status.
- **Vehicle status system:** Status field on vehicles (active, out_of_service, in_shop); color-coded badges (green/red/yellow); status filters on dashboard.
- **Database:** Tables for vehicles, fuel_logs, service_records, issues, documents, drivers, inspections (schema in place); RLS; indexes.
- **Business logic:** Oil change overdue when current_mileage >= oil_change_due_mileage; document expired when expiration_date < today; issue workflow and priorities.
- **Multi-company:** Companies can have multiple users; company switcher for orgs with more than one fleet (see docs/ADD_NEW_COMPANY.md).
- **UI/UX:** Responsive, dark mode, status badges, modals for forms, loading and error states. Design should stay clean and admin-dashboard style; avoid generic “AI slop” aesthetics.

## What’s Planned / Roadmap

1. **Inspection system (priority):**
   - **List:** `/dashboard/inspections` – list inspections, filter by vehicle, driver, status, date.
   - **Create:** `/dashboard/inspections/new` – select vehicle and driver; inspection type (pre_trip, post_trip, scheduled, incident); checklist (Brakes, Tires, Lights, Mirrors, Fluids, Body, Engine, Transmission – each OK/Not OK + notes); photo uploads (front, back, left, right); mileage; auto Pass/Fail (fail if any item Not OK); notes.
   - **Detail:** `/dashboard/inspections/[id]` – full inspection view, photos, checklist, notes.
   - **Vehicle detail:** Add status dropdown and driver assignment on vehicle edit; show current driver.

2. **Custom dashboards (later):**
   - Dashboard templates: Default, Compact, Executive; custom layouts (sections/tabs) via Control Panel / Template Builder.

3. **General product direction:**
   - Keep mobile-friendly (field use); improve fleet health visibility; keep document and issue tracking tight; align inspection flow with real pre/post-trip workflows (Fleetio-style).

## Key Conventions

- **Design:** Professional, clear, fleet-manager-focused. Prefer consistent color coding: green = Active/OK, red = Out of Service/Overdue/Failed, yellow = In Shop/Warning. No unnecessary decoration.
- **Code:** Next.js App Router; TypeScript; Supabase client/server and RLS; Tailwind for layout and components.
- **Docs in repo:** README.md, PROJECT_SUMMARY.md, FEATURES_SUMMARY.md, NEXT_STEPS.md, GETTING_STARTED.md, DEPLOYMENT.md, ENV_TEMPLATE.md, docs/ADD_NEW_COMPANY.md. Supabase schema in `supabase/` (e.g. schema.sql, schema-updates.sql).
- **Integrations:** FleetPulse is also referenced on PrushLogistics.com as “our platform” / built by Prush Logistics; link to FleetPulseHQ.com and keep branding consistent (Prush = logistics brand, FleetPulse = software product).

When suggesting features, UI, or copy, stay consistent with this context. Prefer concrete, implementable suggestions that fit the existing stack and roadmap.

---

*End of prompt. Paste the above into your FleetPulse project in ChatGPT.*
