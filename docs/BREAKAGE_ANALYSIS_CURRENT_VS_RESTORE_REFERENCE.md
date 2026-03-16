# Breakage Analysis: Current FleetPulse vs FleetPulseRestoreReference

This document lists **why the current version is broken** compared to the known-good **FleetPulseRestoreReference** (yesterday’s working snapshot), and **what needs to be done** to get back to 100% working while **keeping the changes we wanted to add today**. No fixes are applied here—analysis only.

---

## Root cause summary (why it broke)

1. **Root layout was changed in one go** — ErrorBoundary, IntroAnimation, BackgroundLayer, and NavbarLayout were added around the whole app without checking that the **document/body** remained the only scroll container. Several components (ScrollBlur, FloatingLoginCard, ScrollToTop) depend on `window.scrollY`; if any wrapper trapped scroll, they stopped working.

2. **Intro animation was added without robust fallbacks** — The first-load overlay uses a video and a purple background. If the video path was wrong or the file missing/slow, users saw a long purple screen instead of a clear “loading” or skip.

3. **A global ErrorBoundary was added** — Every client-side throw now shows “FleetPulse encountered an error” and triggers a reload, so one failing component (e.g. dashboard) makes the whole app feel broken. The reference had no global boundary, so failures were local.

4. **Asset and import paths were reorganized** — Components moved to `layout/`, `animations/`, `marketing/`; assets to `branding/`, `animations/`. Missing or mismatched paths (e.g. `animations` vs `Animations`) led to 404s and broken UI.

5. **No incremental validation** — Changes weren’t validated after each structural step (e.g. “after adding NavbarLayout, does the landing still scroll? Does the dashboard still load?”). The known-good reference wasn’t used as a diff target before considering the work “done.”

So: **structural and UX changes were made without guarding scroll context, error scope, asset paths, or first-load fallbacks, and without a quick checklist against the reference.**

---

## 1. Root layout was completely restructured

**Reference (working):**
- `ThemeProvider` → `PageTransitionProvider` → `RouteTransition` + `{children}`.
- Body: only `className={inter.className}`.
- No ErrorBoundary, no BackgroundLayer, no IntroAnimation, no NavbarLayout, no `<main>` wrapper.

**Current (broken):**
- `ThemeProvider` → `ErrorBoundary` → `BackgroundLayer` + `div` → `IntroAnimation` → `PageTransitionProvider` → `NavbarLayout` → `<main>{children}</main>`.
- Body: `overflow-x-hidden min-h-full`.
- Content is always wrapped in IntroAnimation, NavbarLayout, and main.

**Why it breaks:**
- Extra wrappers and conditional rendering (e.g. IntroAnimation overlay, Navbar only on some routes) increase the chance of hydration/layout issues and change when/where scroll happens.
- Any client throw is now caught by the global ErrorBoundary and shown as “FleetPulse encountered an error” + reload instead of failing only in dev or being isolated.

**What to do:**
- Decide which of the new pieces are required (e.g. Intro once, Navbar on dashboard, error handling).
- Either simplify the root tree back toward reference (fewer wrappers, same scroll behavior) or keep the new structure but fix scroll/context so it matches reference behavior (e.g. body/document is the only scroller, no inner scroll trap).

---

## 2. Intro animation added (new first-load experience)

**Reference:**
- No intro. User lands directly on the landing page.

**Current:**
- `IntroAnimation` + `IntroAnimationOverlay` with `officialFPAnimation.mp4` (paths: `/animations/` then `/Animations/`).
- Overlay has purple/dark background; video can fail or load slowly.
- Failsafe timeout (e.g. 8s) then hides overlay.

**Why it breaks:**
- If the video path is wrong (e.g. `public/animations` vs `public/Animations`), or the file is missing/slow, users see the **purple screen** and a faint box for several seconds.
- Overlay is fixed and covers the whole screen; if the video doesn’t show clearly, the “stall while loading” feeling is worse.

**What to do:**
- Ensure the intro video path matches the actual folder (`animations` vs `Animations`) and the file exists in `public`.
- Optionally: only show the overlay once the video has loaded (e.g. `onLoadedData`), or shorten/skip the intro when the video fails so the purple screen doesn’t last 5–6 seconds.
- Keep the “pulse/zoom into landing” behavior but tie it to actual video playback (e.g. ~2s before end) so it doesn’t feel disconnected.

---

## 3. Global ErrorBoundary added

**Reference:**
- No global error boundary. Client errors show React error overlay (dev) or a broken/blank screen (prod).

**Current:**
- `ErrorBoundary` wraps the whole app. Any client-side throw leads to “FleetPulse encountered an error. Reloading…” and then a full reload.

**Why it breaks:**
- Previously, a single component error (e.g. dashboard) might only break that view. Now **any** throw is turned into the same message and a reload, so it feels like “the app is broken” even when the cause is a single page or component.
- The dashboard was one source of throws (e.g. `vehicle.code` or missing env); we’ve fixed some of those, but the global boundary still turns every remaining error into the same UX.

**What to do:**
- Keep a global boundary for true top-level failures, but make it less aggressive (e.g. don’t auto-reload, or only reload on a specific class of error).
- Use **local** error boundaries (e.g. `DashboardErrorBoundary`) so dashboard (or other sections) can show “Dashboard couldn’t load” with retry/back, without triggering the global “FleetPulse encountered an error” + reload. We already added a dashboard-level boundary; ensure it’s the one that catches dashboard errors first.

---

## 4. Dashboard structure and Navbar placement

**Reference:**
- Dashboard **page** renders: `<Navbar />` + `TabSlideTransition` + `DashboardClient`.
- Dashboard **layout** only: activation check + `pt-[56px]` + `{children}` (no Navbar in layout).

**Current:**
- Dashboard **page** renders: `DashboardErrorBoundary` → `TabSlideTransition` → `DashboardClient` (no Navbar in page).
- Navbar is shown by **root** `NavbarLayout` when `pathname` is `/dashboard` or under.
- Dashboard **layout**: `pt-[64px]` + `key={pathname}` + `animate-tab-enter` + `{children}`.

**Why it could break:**
- Navbar depends on `NavbarLayout` and `usePathname()` in the root. If the root layout or routing changes, the navbar might not show on dashboard or might show when it shouldn’t.
- Dashboard layout calls `createClient()` (Supabase) in a client component; if that threw before we used `?? ''`, the layout could throw and the global ErrorBoundary would catch it.

**What to do:**
- Keep centralizing the Navbar in the root is fine, but ensure `NAV_ROUTES` (or equivalent) and pathname checks match all dashboard routes.
- Keep `createClient()` non-throwing (env fallbacks) and keep defensive `vehicle.code` handling in `DashboardClient` so the dashboard never throws for missing code or env.

---

## 5. Component and asset path reorganization

**Reference:**
- Flat: `@/components/ThemeProvider`, `@/components/PageTransition`, `@/components/Navbar`, `@/components/ScrollBlur`, `@/components/FloatingLoginCard`, etc.
- Landing hero logo: **video** `/assets/fleetpulse_logo_loop.mp4`.
- Navbar company logos: `/images/companylogos/{slug}.png`.
- Icons: `/fpfavicon.png`, etc.

**Current:**
- Nested: `@/components/layout/ThemeProvider`, `@/components/animations/PageTransition`, `@/components/layout/Navbar`, `@/components/animations/ScrollBlur`, `@/components/marketing/FloatingLoginCard`, etc.
- Landing hero: **image** `/branding/fleetpulse-navbar.png` (and we added a single “Modern Fleet Management” headline to avoid duplication).
- Navbar company logos: `/company-logos/{slug}.png` (and `NavbarView` uses `/branding/fleetpulse-navbar.png`).
- Icons: `/branding/favicon.ico`, `/branding/fleetpulse-icon-32.png`.

**Why it breaks:**
- Wrong or outdated import paths → build or runtime errors.
- Missing assets: if `public/branding/` or `public/animations/` don’t exist or have different names (e.g. only `Animations` with capital A), images/videos 404 and the UI looks broken (e.g. purple screen, missing logo).

**What to do:**
- Audit all imports to match the new folder structure; ensure no reference still points to old paths.
- Ensure `public` has the right folders and files: e.g. `public/animations/officialFPAnimation.mp4`, `public/branding/fleetpulse-navbar.png`, and that middleware/Next config don’t block them. Align with reference if needed (e.g. `public/Animations` vs `public/animations`).

---

## 6. Scroll container and scroll-dependent behavior

**Reference:**
- Body is the default scroll container; no extra wrapper with `overflow` that would create an inner scroll.
- `RouteTransition` is a fixed overlay and doesn’t affect document scroll.

**Current:**
- Body: `overflow-x-hidden min-h-full`. Inner div: `relative z-10 min-h-full overflow-x-hidden`.
- `NavbarLayout` → `PageTransitionWrapper` (framer-motion `motion.div` with `min-h-full`) → `main` → children.

**Why it breaks:**
- If any wrapper gets `overflow: auto` or `overflow: hidden` with a fixed height, the **document** might not scroll; only an inner div would. Then `window.scrollY` stays 0 or doesn’t reflect user scroll.
- **ScrollBlur** and **FloatingLoginCard** both rely on `window.scrollY`. If the window never scrolls, the “Everything you need to manage your fleet” section never unblurs and the login card never collapses on scroll.
- **ScrollToTop** also uses `window.scrollY`; if the window doesn’t scroll, the button never appears.

**What to do:**
- Ensure the **document/body** is the only scroll container for the main content: no `overflow-y: auto` or fixed height on a wrapper that contains the landing/dashboard content.
- Keep `overflow-x-hidden` if needed, but avoid anything that traps vertical scroll. Then scroll-based behavior (blur, login collapse, back-to-top) will work again.

---

## 7. RouteTransition vs PageTransition and login flow

**Reference:**
- **RouteTransition**: pathname-based overlay that shows “Loading {Login|Sign Up|Home}…” and a video when navigating to non-dashboard routes. Used for route changes.
- Login from landing: FloatingLoginCard does `router.push('/dashboard')` then `setTimeout(…, window.location.href = '/dashboard')` (full reload). So after login, user gets a full reload; RouteTransition might briefly show “Loading…” on the way to `/login` if they go to login page first.

**Current:**
- No **RouteTransition** in the root layout.
- **PageTransitionProvider** + **LoadingOverlay** (with possibleLogoLoop) are used when **Navbar**’s `navigateTo()` is used (e.g. dashboard internal navigation). FloatingLoginCard still does `router.push` + `window.location.href` for login, so login from landing is a **full page reload** and does **not** go through PageTransition or show the logo loop overlay.

**Why it breaks:**
- The desired “possibleLogoLoop + pulse into fleet overview” after login is not possible with the current flow because we’re doing a full reload. The overlay is only used for in-app navigation (e.g. Navbar links), not for post-login redirect.

**What to do:**
- Either: (a) Use a dedicated “post-login” route or a client-side transition that shows LoadingOverlay (possibleLogoLoop) and then navigates to `/dashboard` without a full reload, or (b) Accept full reload but add a small loading state on the dashboard route (e.g. show the logo loop while dashboard data loads). Don’t rely on the current PageTransition for login-from-landing.

---

## 8. DashboardClient: vehicle.code and getTerritory

**Reference:**
- `getTerritory`: `territoryMap[vehicle.code.toLowerCase()]` with no optional chaining.
- Other uses: `vehicle.code.toLowerCase()`, `plateMap[vehicle.code.toLowerCase()]`, etc. If `vehicle.code` is null/undefined, this throws.

**Current:**
- We added `vehicle.code?.toLowerCase() ?? ''` and `getTerritory` uses a safe `code` variable. This is a **fix**, not a regression.

**What to do:**
- Keep the current defensive handling so the dashboard never throws on missing `vehicle.code`.

---

## 9. Supabase createClient (browser)

**Reference:**
- `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`. Non-null assertion; if env is missing, this can throw.

**Current:**
- `url = process.env... ?? ''`, `key = process.env... ?? ''` then `createBrowserClient(url, key)`. Does not throw.

**What to do:**
- Keep the current non-throwing client so missing env doesn’t trigger the global ErrorBoundary.

---

## 10. ScrollBlur and FloatingLoginCard scroll thresholds

**Reference:**
- ScrollBlur: only `window.scrollY` and viewport threshold (e.g. 30%). No IntersectionObserver.
- FloatingLoginCard: collapse when `scrollY > 150`, expand when `scrollY <= 50`.

**Current:**
- ScrollBlur: same scroll logic + **IntersectionObserver** fallback when section is in view (so unblur even if window doesn’t scroll).
- FloatingLoginCard: collapse when `scrollY > 80` (more aggressive). Current scroll listener does not use `{ passive: true }` (reference does).

**Why it breaks:**
- If the window doesn’t scroll (see §6), both components still misbehave. IntersectionObserver mitigates ScrollBlur only when the section is in view; it doesn’t fix the login card or back-to-top.

**What to do:**
- First fix the scroll container (§6) so `window.scrollY` updates. Then ScrollBlur and FloatingLoginCard will behave. Optionally keep the 80px threshold and IntersectionObserver as improvements.

---

## 11. Back-to-top button (ScrollToTop)

**Reference:**
- ScrollToTop is used on the landing page; visibility when `window.scrollY > 300`. No explicit z-index.

**Current:**
- Same logic; we set `z-[60]` so it sits above the login card.

**Why it could break:**
- If the button “isn’t there,” it’s either: (1) covered by something with higher z-index, (2) not mounting (e.g. wrong route or layout), or (3) window doesn’t scroll so it never becomes visible.

**What to do:**
- Ensure document scroll works (§6) and no overlay (e.g. intro, modal) has a z-index above 60 that covers the bottom-right. Keep z-[60].

---

## 12. Footer and CTA section

**Reference:**
- CTA section at the end of the landing (video + “Ready to streamline…” + buttons). No dedicated footer block.

**Current:**
- Same CTA section (with Image/branding instead of video in one place) plus a **new footer** (gradient, links, copyright).

**What to do:**
- Footer is additive. Keep it; no revert needed. If styling “doesn’t blend,” adjust gradients and spacing to match the CTA.

---

## 13. Dashboard layout createClient and activation check

**Reference:**
- Dashboard layout (client) calls `createClient()` in `useEffect` for `getUser()`. If createClient threw (e.g. missing env), the effect would throw and the layout could break.

**Current:**
- Same flow but createClient no longer throws. We also have an extra `useEffect` that logs when dashboard is rendered, and we use `pt-[64px]` and `animate-tab-enter`.

**What to do:**
- Keep non-throwing createClient. The rest is cosmetic; only adjust if something still throws in the layout (e.g. a child component).

---

## 14. Summary: what to do to get back to 100% while keeping today’s changes

| Area | Action |
|------|--------|
| **Root layout** | Simplify or validate wrapper tree; ensure body/document is the only vertical scroll container and no wrapper traps scroll. |
| **Intro animation** | Verify video path and file existence; optionally show overlay only after video loads; keep pulse/zoom timing. |
| **ErrorBoundary** | Keep global boundary but avoid auto-reload or narrow its use; rely on dashboard (and other local) boundaries for section errors. |
| **Dashboard** | Keep Navbar from NavbarLayout; keep defensive vehicle.code and createClient; keep DashboardErrorBoundary. |
| **Paths** | Ensure all imports use new paths (layout/, animations/, marketing/, ui/); ensure public/animations and public/branding exist and match code. |
| **Scroll** | Fix scroll container so window scrolls; then ScrollBlur, FloatingLoginCard, and ScrollToTop will work. |
| **Login → dashboard** | Implement a post-login flow that shows possibleLogoLoop (and pulse) then navigates to dashboard, or show that overlay on dashboard load. |
| **Landing hero** | Keep single headline and navbar logo image; ensure branding assets exist. |
| **Footer** | Keep; adjust styling to blend with CTA if needed. |
| **Supabase / DashboardClient** | Keep current non-throwing client and optional chaining on vehicle.code. |

---

*Generated by comparing current codebase with `Restore Points/FleetPulseRestoreReference` (known-good snapshot).*
