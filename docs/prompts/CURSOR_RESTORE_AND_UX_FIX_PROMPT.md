# Cursor Prompt: FleetPulse Recovery + UX/Animation Overhaul

You are working in the `FleetPulse` repo (Next.js 14 app router). The production app has regressions after recent branding/animation changes and route refactors.

## Mission
Fix the app end-to-end so it is stable and matches this intended UX:

1. First visit to `fleetpulsehq.com`: show `officialFPAnimation.mp4` with a polished blend into landing (blur/pulse/reveal effect).
2. Landing top section: redesign to look SaaS-professional. Right-side login panel should minimize on scroll, and a bottom-right smooth "back to top" action should restore/open the login panel.
3. Login success: play a smooth transition using `possibleLogoLoop.mp4`, then animate into fleet overview without crashes.
4. Dashboard must load (no "FleetPulse encountered an error" reload loop).

---

## Critical context already discovered

### A) Media path casing is inconsistent (likely breaking animation loading)
- Multiple components use lowercase `/animations/...` first, with uppercase fallback `/Animations/...`.
- On case-sensitive hosts, wrong-case paths can fail.
- Existing files are duplicated across:
  - `public/Animations/*.mp4`
  - `public/videos/*.mp4`

**Affected files include:**
- `components/IntroAnimationOverlay.tsx`
- `components/marketing/LandingIntro.tsx`
- `components/animations/EntryAnimation.tsx`
- `components/animations/LoadingOverlay.tsx`
- `app/(marketing)/login/page.tsx`

### B) Global error handling currently masks root causes
- `components/ErrorBoundary.tsx` auto-reloads after 2s and only shows "FleetPulse encountered an error. Reloading...".
- This hides the original runtime exception and creates a loop.

### C) Architecture changed heavily from restore reference
- Old routes like `app/page.tsx`, `app/login/page.tsx`, `app/dashboard/*` were replaced by grouped routes:
  - `app/(marketing)/*`
  - `app/(dashboard)/dashboard/*`
- Navbar/transition/theme components moved into new folders and were refactored.
- We need to keep the new structure but restore reliability and behavior.

### D) Build environment caveat seen locally
- `next build` can fail on Google Font fetch for Inter in restricted environments. Ensure graceful behavior and avoid introducing dependency on network-only build-time resources when possible.

---

## Required implementation plan

### 1) Stabilize and expose real crash source first
1. Temporarily change `components/ErrorBoundary.tsx` to:
   - Stop automatic reload loops.
   - Display actionable debug info in development (error message + component stack).
2. Reproduce dashboard crash and capture console/runtime error.
3. Fix the root cause (do not just silence it).
4. Keep a polished production-safe fallback UI, but **no infinite reload loop**.

### 2) Standardize animation assets and paths
1. Pick one canonical folder (recommended: `public/animations` lowercase).
2. Move/rename files consistently:
   - `officialFPAnimation.mp4`
   - `possibleLogoLoop.mp4`
3. Update all references to exactly one path convention.
4. Remove brittle uppercase/lowercase fallback logic once canonicalized.
5. Add a tiny utility/constants module for animation asset paths so components stay in sync.

### 3) First-visit intro animation polish
Target files:
- `components/IntroAnimation.tsx`
- `components/IntroAnimationOverlay.tsx`
- optionally `components/marketing/LandingIntro.tsx` (merge/cleanup if duplicated behavior)

Requirements:
- Show intro only on first visit/session (persisted flag).
- Preload video and prevent white/black flash.
- As clip nears end, run a smooth sequence: subtle zoom + blur + pulse burst + fade reveal to landing.
- Respect `prefers-reduced-motion` and skip heavy effects for accessibility.
- Ensure no layout shift.

### 4) Landing hero redesign + scroll interactions
Primary file:
- `app/(marketing)/page.tsx`

Related components to implement/refactor:
- `components/marketing/FloatingLoginCard.tsx`
- `components/animations/ScrollToTop.tsx`

Requirements:
- Make top section more enterprise SaaS:
  - cleaner typography hierarchy
  - stronger spacing/grid balance
  - better contrast and CTA emphasis
- Right-side login panel behavior:
  - full state near top
  - smoothly minimizes/collapses while scrolling down
  - restores when user scrolls near top OR taps back-to-top
- Bottom-right back-to-top control:
  - appears after scrolling down
  - smooth scroll to top
  - on completion, expands/reopens login panel
- Keep mobile behavior usable and non-overlapping.

### 5) Login -> dashboard transition experience
Primary file:
- `app/(marketing)/login/page.tsx`

Requirements:
- Keep/upgrade overlay animation using `possibleLogoLoop.mp4`.
- Sequence: auth success -> branded transition -> route transition into dashboard.
- Prevent stuck loading state and race conditions.
- Verify redirect targets are valid for all companies/roles (`/home`, `/dashboard`, `/dashboard/roadmap`, etc.) and consistent with actual routes.

### 6) Regression audit against restore reference
Compare current code with:
- `Restore Points/FleetPulseRestoreReference`

Goal:
- Identify accidental regressions introduced during refactor (especially around auth routing, navbar transitions, and dashboard rendering).
- Restore any lost critical logic from restore reference without undoing desired new UI.

---

## Quality gates (must pass)
1. `npm run build` succeeds.
2. `npm run lint` succeeds (non-interactive config if needed).
3. Manual flows verified:
   - First visit intro plays and transitions cleanly.
   - Landing scroll/minimize/back-to-top interactions work.
   - Login success transition plays.
   - Dashboard/home loads with no global error overlay.
4. No broken media URLs (check network tab for 404s).

---

## Deliverables
1. Code fixes.
2. Short root-cause report in markdown covering:
   - exact crash cause
   - files changed
   - why the regression occurred
   - how it was fixed
3. Before/after screenshots or short clips for:
   - intro transition
   - hero + minimizing login panel
   - login success transition
   - dashboard loading successfully
4. Clear commit messages grouped by concern:
   - stability/crash fix
   - animation asset normalization
   - landing redesign
   - login transition polish
