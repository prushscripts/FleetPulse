# FleetPulse — Master Project Context Document
# Use this to restore full context in any new Claude conversation

---

## WHAT IS FLEETPULSE

FleetPulse is a modern fleet management SaaS platform built for logistics 
and delivery companies. It is designed to be the central operations command 
center for managing vehicles, drivers, inspections, compliance, safety, and 
operational analytics — all from a single intelligent dashboard.

The product vision is to compete with and eventually surpass existing 
fleet management platforms like:
- Samsara (~$25B valuation)
- Motive (formerly KeepTruckin)
- Fleetio (~$1.5B valuation)
- Verizon Connect
- Geotab

FleetPulse should feel like a $100M+ SaaS product — the most visually 
impressive, modern, and powerful fleet management platform in existence.

---

## LIVE PRODUCT

- Website: https://fleetpulsehq.com
- GitHub: https://github.com/prushscripts/FleetPulse
- Hosted on: Vercel
- Database: Supabase (PostgreSQL)
- Domain registrar: Namecheap
- DNS: Vercel (nameservers point to Vercel)
- Email: Zoho Mail (james@prushlogistics.com)
- Transactional email: Resend.com (noreply@fleetpulsehq.com)

---

## TECH STACK

### Web App (Primary)
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + custom CSS design system
- Animations: Framer Motion
- Auth: Supabase Auth
- Database: Supabase (PostgreSQL with RLS)
- Deployment: Vercel
- Icons: Lucide React
- Fonts: Syne (display), Geist (body), Geist Mono (numbers)

### Mobile App (In Development)
- Framework: Expo (React Native)
- Routing: Expo Router
- Styling: NativeWind (Tailwind for RN)
- Auth: Same Supabase backend
- Target: iOS App Store + Google Play Store
- Dev testing: Expo Go

### Design System
- Color palette: Navy dark (#0A0F1E base, #0F1629 surface, #151D35 elevated)
- Accent: Blue (#3B82F6)
- Status colors: Emerald (success), Amber (warning), Red (danger)
- Glass card utility: .card-glass
- Button classes: .btn-primary, .btn-ghost
- Badge classes: .badge, .badge-active, .badge-warning, .badge-danger
- Status dot: .status-dot (active/warning/danger/neutral)
- Skeleton loader: .skeleton

---

## CURRENT OWNER / COMPANY

Owner: James Prush
Company using FleetPulse: Wheelz Up (Prush Logistics Group LLC)
- Professional Automotive Parts Transportation, New York State
- 57 vehicles in fleet
- Two territories: New York and DMV (DC/MD/VA)
- Company access codes:
  - Manager code: WheelzAPD2026!
  - Driver code: Wheelzupauth2026
  - Company invite code: WheelzUpAPD2026
  - Company ID in DB: a0000000-0000-0000-0000-000000000001

James also has a separate business: Prush Logistics Group LLC
- Website: prushlogistics.com
- Logo: Dark charcoal P mark with forward arrow (generated via Ideogram)

---

## PROJECT FOLDER STRUCTURE

```
FleetPulse/ (web app — Desktop/FleetPulse)
├── app/
│   ├── (marketing)/          # Landing, login, signup pages
│   │   ├── layout.tsx        # Marketing navbar only
│   │   ├── page.tsx          # Landing page
│   │   ├── login/page.tsx    # Login with split panel + particles
│   │   └── signup/page.tsx   # Signup with role selection
│   ├── (dashboard)/
│   │   └── dashboard/        # All authenticated pages
│   │       ├── layout.tsx    # AppShell (AppNavbar + BottomTabBar)
│   │       ├── home/         # Manager home/overview
│   │       ├── vehicles/     # Fleet vehicle list
│   │       ├── drivers/      # Driver management
│   │       ├── inspections/  # Inspection reports + templates
│   │       ├── fleet-health/ # Fleet health score dashboard
│   │       ├── admin/        # Admin panel (owner/manager only)
│   │       ├── control-panel/# Company settings + templates
│   │       ├── profile/      # User profile + nickname settings
│   │       ├── about/        # Product features + pricing
│   │       └── roadmap/      # Public roadmap
│   ├── (driver)/             # Driver portal (separate shell)
│   │   └── driver/
│   │       ├── page.tsx      # Driver home
│   │       └── inspection/
│   │           └── [type]/   # Pre-trip inspection flow
│   └── api/                  # API routes
│       ├── validate-access-code/
│       ├── sync-profile/
│       ├── driver-report-issue/
│       ├── notifications/create/
│       └── vehicles/[id]/
│           ├── assign-driver/
│           └── unassign-driver/
├── components/
│   ├── app/
│   │   ├── AppNavbar.tsx     # Top navbar (authenticated)
│   │   ├── AppShell.tsx      # Authenticated layout wrapper
│   │   ├── BottomTabBar.tsx  # Mobile tab bar
│   │   └── NicknamePromptModal.tsx
│   ├── animations/
│   │   ├── IntroAnimation.tsx # Site entry animation
│   │   └── LoginTransition.tsx # Post-login animation
│   ├── vehicles/
│   │   ├── VehicleRow.tsx
│   │   ├── VehiclePanel.tsx  # Floating side panel
│   │   └── DriverAssignmentTab.tsx
│   ├── landing/              # Landing page sections
│   └── ui/                   # Reusable components
├── lib/
│   └── supabase/
├── public/
│   ├── Animations/           # MP4 animation files (capital A)
│   │   ├── officialFPAnimation.mp4  # Site intro video
│   │   └── possibleLogoLoop.mp4     # Login transition video
│   ├── branding/             # Logos, favicon, etc
│   └── animations/           # Lowercase (local dev)
├── supabase/                 # SQL migration files
│   ├── schema.sql
│   ├── phase2-driver-assignment-columns.sql
│   ├── phase2-inspections-announcements.sql
│   ├── phase2-user-role.sql
│   ├── phase2-rls-inspections-announcements.sql
│   ├── add-role-access-codes.sql
│   ├── admin-notifications-schema.sql
│   └── email-templates/
│       └── confirm-signup.html
└── .env.local                # Supabase URL + anon key
```

---

## DATABASE SCHEMA (Key Tables)

### companies
- id, name, invite_code, auth_key, plan
- manager_access_code, driver_access_code
- territory_notifications (boolean)
- enabled_tabs, custom_tab_labels, inspections_enabled

### profiles (extends auth.users)
- id (= auth.users.id), company_id, nickname
- role: 'owner' | 'manager' | 'driver' | 'mechanic'
- territory: 'New York' | 'DMV' | '' (all)

### vehicles
- id, company_id, truck_number, type, year, make, model
- mileage, oil_change_due, status
- location: 'New York' | 'DMV' | 'Other'
- assigned_driver_id (FK → drivers.id)

### drivers
- id, company_id, user_id (FK → auth.users)
- first_name, last_name, email, phone
- location: 'New York' | 'DMV' | 'Other'
- is_ny_driver (bool), is_dmv_driver (bool)
- assigned_vehicle_id (FK → vehicles.id)
- active, license_number, license_expiration

### inspections
- id, company_id, vehicle_id, driver_id
- type: 'pre_trip' | 'post_trip'
- status: 'passed' | 'failed' | 'needs_review'
- odometer, results (JSONB), notes
- submitted_at, reviewed_by, reviewed_at

### inspection_templates
- id, company_id, name, type
- items (JSONB): [{id, label, category, required}]
- is_default

### issues
- id, company_id, vehicle_id, driver_id
- title, description, priority, status
- source: 'manual' | 'pre_trip' | 'post_trip' | 'check_in'
- inspection_id

### announcements
- id, company_id, title, body
- target: 'all' | 'new_york' | 'dmv'
- is_active, expires_at, created_by

### notifications
- id, company_id, recipient_user_id
- type: 'inspection_failed' | 'issue_reported' | 'announcement'
- title, body, data (JSONB)
- recipient_territory, read, deleted
- created_at

### service_records
- id, vehicle_id, company_id
- type, description, cost, mileage_at_service
- performed_by, performed_at

---

## USER ROLES

1. **owner/manager** — Full access to everything
   - Sees: Home, Health, Vehicles, Drivers, Inspections, Admin
   - Admin tab has: Issues feed, Announcements, Team management
   - Gets notifications for failed inspections (filtered by territory)

2. **driver** — Limited access, driver portal only
   - Sees: Their assigned vehicle, pre-trip inspection, 
     announcements, report issue
   - Cannot see any manager-side data
   - Automatically redirected to /driver on login

3. **mechanic** (future) — Vehicles + service records only

---

## AUTHENTICATION FLOW

1. User visits fleetpulsehq.com
   - Intro animation plays (officialFPAnimation.mp4) — once per session
   - sessionStorage key: 'fp_intro_shown'

2. User clicks Sign In
   - Split panel login: particles left, form right
   - Fleet stats card on left panel
   - On success: LoginTransition plays (mission control style)
     phases: authenticating → loading fleet → ready
   - Then redirects to /dashboard/home (manager) or /driver (driver)

3. New user signup
   - Role selection: Fleet Manager | Driver
   - Manager code required: WheelzAPD2026!
   - Driver code required: Wheelzupauth2026
   - Codes validated server-side via /api/validate-access-code
   - Code lookup queries companies table (multi-tenant, not env vars)
   - On signup: /api/sync-profile creates profiles row
   - If driver: also creates drivers table row automatically
   - Nickname prompt modal shown on first login

4. Sign out
   - Calls supabase.auth.signOut()
   - Hard redirect to /

---

## FEATURES BUILT (Current State)

### Landing Page
- Premium dark navy design
- Hero: "Every vehicle. Every driver. One command center."
- Animated dashboard preview mockup
- Features section (6 feature cards)
- Pricing section (Starter $3/Starter $6/Premium $9 per vehicle/month)
- CTA section
- Footer with links
- Open Graph image (dynamic, shows dashboard mockup)
- Proper metadata for social sharing

### Manager Dashboard
- **Home page**: Greeting with time of day, 4 KPI cards,
  Active alerts panel, Recent inspections panel
- **Vehicles page**: Dense list with column headers, color-coded
  left borders (oil status), assigned driver chip, mileage,
  oil overdue miles, floating VehiclePanel on click
- **Fleet Health page**: Health score (0-100), oil compliance bars,
  open issues by priority, inspection pass rate, vehicles needing
  attention, high mileage list, fleet composition
- **Drivers page**: Grid of driver cards with location badges,
  assigned vehicle, account status indicator
- **Inspections page**: List with pass/fail, template management
- **Admin page**: Issues feed, Announcements, Team + territory mgmt
- **Control Panel**: Company config, access codes, template selection,
  dashboard builder (widget system), inspection settings
- **Profile page**: Nickname editing, account info

### Driver Portal
- Greeting with nickname, assigned vehicle card
- Pre-trip inspection button (only pre-trip for WheelzUp)
- Report issue (bottom sheet modal)
- Announcements section
- Recent check-ins history

### Inspection System
- Manager: template builder, review reports
- Driver: 4-phase mobile flow:
  1. Vehicle confirmation screen
  2. Odometer entry
  3. Checklist (Exterior + Interior categories, one at a time)
     - Fail requires note (cannot advance without it)
     - Smooth animated transitions between categories
     - Viewport zoom prevention on mobile
  4. Summary → submit
  5. Success screen (green=passed, amber=failed items)
- On failed inspection: creates issues + sends notifications
- Items: Exterior (6) + Interior (6) — no under hood

### Assignment System
- Drivers have location (NY/DMV) + territory flags
- Vehicle detail has Driver tab with searchable assignment
- Vehicles filter driver list by location
- Vehicle list shows assigned driver chip
- Quick-assign popover from vehicle list

### Notification System
- Bell icon in navbar with unread count badge
- Real-time via Supabase subscriptions
- Types: inspection_failed, issue_reported, announcement
- Territory-filtered: NY managers get NY notifications
- Click → routes to admin issues tab
- Mark read, delete individual, clear all

### Animations
- Site intro: officialFPAnimation.mp4 fullscreen on first visit
- Login transition: mission control style CSS animation
  (no video dependency — reliable)
- Page transitions: fade+scale between dashboard tabs
- Vehicle panel: spring animation slide from right

---

## DESIGN PRINCIPLES

### Visual Direction
- Inspired by: Stripe, Linear, Vercel, Ramp, Retool, Superhuman
- Dark navy backgrounds (#0A0F1E)
- Blue accent (#3B82F6)
- Subtle gradients and lighting effects
- Motion-driven UI (purposeful, not gimmicky)
- Strong visual hierarchy
- Enterprise-grade but approachable

### Mobile
- Bottom tab bar (manager: Home|Health|Vehicles|Drivers|Inspections)
- Touch targets minimum 44px
- Safe area insets for iPhone notch
- Viewport zoom prevention on inputs
- Auto-scroll to top between inspection pages

### Typography
- Display/headings: Syne Bold
- Body: Geist
- Numbers/code: Geist Mono (font-mono)
- All uppercase labels: tracking-widest text-slate-500

---

## WHAT STILL NEEDS TO BE DONE (Web App)

### Critical fixes pending
1. Inspection page vehicle lookup — 4-method fallback needed
   (driver shown on home but not found on inspection page)
2. Build error: AdminInitialData type export
3. Resend SMTP: DNS records added to Vercel, needs verification
4. merchtophat@gmail.com test driver — vehicle assignment
   needs testing end-to-end

### Near-term features
1. Multi-service maintenance reminders (tire rotation, brakes, etc)
2. Service vendor log (who did work, cost, invoice)
3. Driver license expiry tracking
4. Document expiry alerts dashboard widget
5. Email digest (daily/weekly fleet summary)
6. In-app notification center (real feed, not just dot)
7. Push notifications (Web Push API for PWA)
8. Upcoming maintenance panel (next 30 days)

### Visual polish needed
1. Landing page intro animation not playing consistently
   (video path case sensitivity issue: /Animations/ vs /animations/)
2. Double logo on login page mobile (extra logo inside left panel)
3. Driver home page layout overlapping on mobile
4. Control panel template builder needs drag-and-drop
   (currently up/down arrows only)

---

## MOBILE APP (EXPO) — PLANNED

### Status: Not started, ready to begin

### Architecture
```
FleetPulseApp/ (separate folder from web app)
Same Supabase backend, same auth, same database
```

### Phase 1: Setup
- Expo Router, NativeWind, Supabase client
- Design tokens matching web (same colors)
- Base components: Card, Button, Badge, Skeleton

### Phase 2: Auth + Manager Home
- Login screen with dark design
- Bottom tab navigator (5 tabs)
- Manager home with KPI cards

### Phase 3: Vehicles + Detail
- FlatList vehicle list
- Vehicle detail with tabs
- Driver assignment bottom sheet

### Phase 4: Driver Portal
- Driver home screen
- Step-by-step inspection flow (same logic as web)

### Phase 5: App Store prep
- Push notifications (expo-notifications)
- EAS Build configuration
- App Store + Play Store submission

### Required accounts (register if not done)
- expo.dev (free)
- Apple Developer: developer.apple.com ($99/year)
- Google Play: play.google.com/console ($25 one-time)

### App identifiers
- Bundle ID (iOS): com.fleetpulse.app
- Package (Android): com.fleetpulse.app

---

## LONG-TERM PRODUCT ROADMAP

### Tier 1 — MVP (built or near-complete)
- Vehicle inventory + oil tracking ✅
- Driver management ✅
- Digital pre-trip inspections ✅
- Issue reporting ✅
- Document storage ✅
- Fleet health dashboard ✅
- CSV import ✅
- Multi-user with access codes ✅
- Driver portal + role-based access ✅
- Notification system ✅

### Tier 2 — 3-6 months
- Multi-service maintenance scheduling
  (oil, tires, brakes, filters — each with own intervals)
- Service vendor log + cost tracking
- Registration/insurance expiry alerts
- Driver license expiry tracking
- Driver performance scores
- Email digest notifications
- Configurable alert thresholds
- PWA (installable on phone from browser)

### Tier 3 — 6-18 months
- Fleet cost analytics (spend by vehicle, month, category)
- Vehicle lifecycle analysis (cost per mile)
- Downtime tracking
- PDF report generation (fleet health summary)
- Custom dashboard builder (drag-and-drop widgets)
- Fuel log tracking (manual entry, MPG calculation)
- Dispatch board (visual driver-vehicle assignment)
- Custom inspection templates per vehicle type
- Role-based permissions (Owner/Manager/Dispatcher/Driver/Mechanic)
- Driver invite flow from Control Panel

### Tier 4 — 18+ months (Enterprise/Moat)
- Telematics integration (Samsara, Motive, Geotab APIs)
  - Live GPS map view
  - Automatic mileage sync
  - Engine fault codes (DTC)
  - Idle time monitoring
- Driver safety scoring (from telematics)
- QuickBooks/Xero integration
- Fuel card integration (WEX, Comdata)
- Webhook API + Zapier integration
- AI predictive maintenance
- AI fleet optimization recommendations
- Multi-location / holding company support
- White-label option
- SSO (Google Workspace, Microsoft 365)
- SOC 2 Type II compliance

---

## CONTROL PANEL — TEMPLATE MARKETPLACE

### Concept (Shopify-style)
Companies can fully customize their FleetPulse experience:
- Choose from templates (free + paid)
- Drag-and-drop dashboard widgets
- Custom tab labels and visibility
- Custom accent colors
- Territory configuration

### Free Templates (built)
1. Operations Standard (default)
2. Maintenance Focus
3. Driver-Centric
4. Executive Overview
5. Compact Ops

### Marketplace (future)
- Premium templates by FleetPulse + verified partners
- Revenue split: 70% creator / 30% FleetPulse
- One-time purchase, tied to company_id
- Template configs stored as JSON in templates table

### Dashboard Widgets (built/planned)
- Fleet KPI Stats
- Oil Change Status Bar
- Active Alerts Panel
- Recent Inspections Feed
- Driver Activity Feed
- Vehicles Due for Service
- Fleet Map Preview (future)
- Quick Actions Panel
- Announcements Preview
- Custom Stat Card

---

## PRICING STRATEGY

### Current Plans
- Starter: $3/vehicle/month (annual) or $4 monthly
  Features: Basic tracking, service records, issue tracking,
  manual reminders, email support

- Professional: $6/vehicle/month (annual only)
  Features: Everything in Starter + driver management,
  digital inspections, fleet health dashboard, CSV import/export,
  advanced analytics

- Premium: $9/vehicle/month (annual only)
  Features: Everything in Professional + advanced analytics,
  API access, custom integrations, dedicated support

### Future Add-ons
- Custom template marketplace access
- Telematics integration ($X/vehicle/month)
- Advanced analytics module
- Custom territory configuration (already partially built)
- White-label (enterprise pricing)

---

## ENVIRONMENT VARIABLES

### Web App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
```

### Vercel Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- MANAGER_ACCESS_CODE=WheelzAPD2026! (can delete after DB migration)
- DRIVER_ACCESS_CODE=Wheelzupauth2026 (can delete after DB migration)

### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=[same as web]
EXPO_PUBLIC_SUPABASE_ANON_KEY=[same as web]
```

---

## DEPLOYMENT WORKFLOW

1. Make changes in Cursor
2. Run 1Deploy.bat (in project root)
   - This does: git add . → git commit → git push
3. Vercel auto-builds and deploys on push to main
4. Check Vercel dashboard for build status

### Local build (if needed)
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```
Note: Local builds often fail due to RAM limits on 
James's machine. Deploy to Vercel instead.

### Common build errors
- Type errors in TypeScript → fix imports/exports
- Memory heap error → use $env:NODE_OPTIONS above
- Extension host crash in Cursor → 
  Was caused by Java extensions (now disabled) and 
  large files in project. Fixed by:
  - Disabling Java/Python extensions in Cursor
  - Removing video files from project
  - Proper .cursorignore rules
  - Deleting .next cache folder

---

## .CURSORIGNORE (Important)

```
node_modules
.next
dist
build
out
coverage
.cache
.env
.env.local
.supabase
supabase
*.zip
*.png
*.jpg
*.jpeg
*.svg
*.ico
*.mp4
*.mov
*.webm
*.gif
assets
public/images
public/videos
public/animations
MobileImages
archive
Restore Points
reports
scripts
docs
data
phase2-backup
.phase2-backup
components/archive
1-TruckInformation
.git
*.log
.DS_Store
Thumbs.db
```

---

## SUPABASE SQL MIGRATIONS (Run in order)

All files in supabase/ folder. Run in Supabase SQL Editor:
1. schema.sql (base schema)
2. companies-multi-tenant.sql
3. phase2-user-role.sql
4. phase2-driver-assignment-columns.sql
5. phase2-inspections-announcements.sql
6. phase2-rls-inspections-announcements.sql
7. add-role-access-codes.sql
8. admin-notifications-schema.sql (notifications + territory)
9. fix-existing-driver-account.sql (one-time, for test account)

---

## EMAIL SYSTEM

### Transactional email
- Provider: Resend.com (free tier, 3000/month)
- Sender: noreply@fleetpulsehq.com
- SMTP configured in Supabase Auth settings
- DNS records added to Vercel:
  - resend._domainkey (TXT/DKIM)
  - send (MX)
  - send (TXT/SPF)

### Email templates (in supabase/email-templates/)
- confirm-signup.html — branded FleetPulse dark design
- Subject: "Confirm your FleetPulse account"
- Paste into Supabase → Authentication → Email Templates

---

## KNOWN ISSUES / BUGS

1. **Inspection page vehicle lookup fails**
   Driver shown on home page but inspection page shows 
   "No vehicle assigned". Fix: 4-method fallback lookup.

2. **Build error: AdminInitialData type**
   lib/preview-admin-data.ts imports type that isn't exported
   from AdminClient.tsx after rewrite.

3. **Landing page intro animation inconsistent**
   Video path case sensitivity: GitHub has /Animations/ (capital A)
   but components reference /animations/ (lowercase).
   Fix: use both <source> tags as fallback.

4. **merchtophat test driver**
   Manually added to drivers table via SQL.
   company_id updated in profiles table.
   Vehicle assignment (z631) needs end-to-end testing.

5. **Login page double logo on mobile**
   Extra logo image inside left panel shows on mobile
   (should be hidden lg:hidden but may not be working).

---

## IMPORTANT NOTES FOR CURSOR

- NEVER modify /api/, /lib/auth/, or /server/ without explicit instruction
- NEVER change auth logic or database calls unless told to
- ALWAYS read files completely before editing
- ALWAYS run npm run build conceptually before deploying
- ALWAYS create backups before major changes
- The design system lives in globals.css — preserve all tokens
- Two route groups exist: (marketing) and (dashboard) — never mix their layouts
- The (driver) group is a completely separate shell from (dashboard)
- Old routes (/vehicles, /admin etc at root) have been deleted
  All app routes are under /dashboard/*
- Videos are in public/Animations/ (capital A) on GitHub/Vercel
  but public/animations/ (lowercase) locally

---

## WHAT MAKES FLEETPULSE DIFFERENT

1. **Design quality** — Most fleet tools look like enterprise software 
   from 2015. FleetPulse looks like it was built in 2026 by a 
   well-funded startup.

2. **Driver experience** — Most platforms ignore the driver-side UX.
   FleetPulse has a dedicated mobile-first driver portal with a
   proper inspection flow.

3. **Territory-aware notifications** — Managers only get notified
   for their territory's drivers. Most platforms have one-size-fits-all.

4. **Template marketplace** — No other fleet platform lets companies
   fully customize their dashboard experience like a Shopify store.

5. **Pricing** — Significantly cheaper than Samsara/Motive while
   offering comparable core features. No telematics hardware required.

---

## JAMES'S CONTEXT

- Running FleetPulse as a SaaS side project
- Currently using it internally at Wheelz Up (his own logistics company)
- Plans to sell to other logistics companies
- Has Cursor Pro + Claude for development
- Builds via Cursor AI — sends prompts, Cursor implements
- Deploys via 1Deploy.bat → Vercel auto-deploy
- Apple Developer account needed (register at developer.apple.com)
- Google Play Developer account needed (register at play.google.com/console)

---

## HOW TO USE THIS DOCUMENT

Paste this entire document at the start of a new Claude conversation
with the message:

"This is my FleetPulse project. Please read this entire context 
document and confirm you understand the full scope of the project 
before we continue."

Claude will then have full context on:
- What the product is and does
- Current technical state
- What's built vs what needs building
- Design system and principles
- Deployment workflow
- Known issues
- Long-term roadmap

---

Last updated: March 2026
