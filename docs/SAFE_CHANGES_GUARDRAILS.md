# Safe changes & guardrails — prevent regressions like the March 2025 breakage

This doc exists so we **don’t repeat the kind of breakage** that happened when the current app was compared to FleetPulseRestoreReference. Use it before merging big layout/UX changes and when adding new global behavior.

---

## 1. Why that breakage happened (one paragraph)

The root layout was restructured (ErrorBoundary, IntroAnimation, NavbarLayout, etc.) without ensuring the **document/body** stayed the only scroll container. ScrollBlur, FloatingLoginCard, and ScrollToTop depend on `window.scrollY`; when scroll was trapped or the tree changed, they broke. A global ErrorBoundary turned every client error into a full-app “FleetPulse encountered an error” + reload. The intro overlay had no robust fallback for a missing/slow video, so users saw a long purple screen. Asset and import paths were reorganized without verifying every reference (e.g. `animations` vs `Animations`). There was no incremental “does scroll still work? does dashboard still load?” check, and no diff against the known-good restore reference before considering the work done.

---

## 2. Before you merge or deploy: checklist

Run through this when you’ve touched **root layout**, **scroll-dependent UI**, **error boundaries**, **intro/landing**, or **asset paths**. Prefer doing it **before** merging, not only on deploy.

- [ ] **Landing loads** — Open `/`. Page renders (with or without intro); no blank or endless purple screen.
- [ ] **Intro fails gracefully** — If the intro video is missing or slow, the app still reaches the landing within a few seconds (failsafe or skip).
- [ ] **Landing scrolls** — Scroll down the landing page. The “Everything you need to manage your fleet” section **unblurs** as you scroll.
- [ ] **Login card collapses on scroll** — On landing, scroll down; the floating login card minimizes. Scroll back to top; it expands again.
- [ ] **Back-to-top appears** — Scroll down the landing; the back-to-top button appears and works.
- [ ] **Login → dashboard** — Sign in from landing or `/login`. You reach the dashboard (or expected redirect); no “FleetPulse encountered an error” unless something is genuinely broken.
- [ ] **Dashboard loads** — Open `/dashboard` when logged in. Dashboard content loads; no global error screen. If something fails, a **section** error (e.g. “Dashboard couldn’t load”) is acceptable; full-app “Reloading…” should not be the only outcome for a single section error.
- [ ] **Asset paths** — Any new or moved images/videos (e.g. under `public/animations`, `public/branding`) are referenced with the correct path and casing; no 404s in Network tab for critical UI assets.

If any item fails, fix or revert before considering the change set “done.”

---

## 3. When to use the restore reference

- **Restore reference location:** `Restore Points/FleetPulseRestoreReference/` (see `Restore Points/README.md`).
- **Use it when:**
  - You’re about to change **root layout** (`app/layout.tsx`) or add/remove global wrappers (ErrorBoundary, IntroAnimation, NavbarLayout, etc.).
  - You’re changing how **scroll** works (e.g. new scrollable container, overflow on a wrapper that wraps main content).
  - You’re adding or changing **global error handling** (e.g. a new top-level ErrorBoundary).
  - The app is broken and you need a diff to see what’s different from a known-good state.
- **What to do:** Compare the files you’re changing (layout, components that affect scroll/errors, asset paths) against the same paths in FleetPulseRestoreReference. Ensure you’re not removing the conditions that made scroll and errors work (e.g. body as sole scroller, no scroll trap).

---

## 4. Architecture rules (don’t break these)

- **Scroll container**  
  **ScrollBlur**, **FloatingLoginCard**, and **ScrollToTop** rely on **`window.scrollY`**. Do **not** add a wrapper around the main page content that has its own scroll (e.g. `overflow-y: auto` and a fixed height). The **document/body** must remain the primary (or only) vertical scroll container for the landing and dashboard content.

- **Error boundaries**  
  Use **local** error boundaries (e.g. per-route or per-section like DashboardErrorBoundary) so a single failing section doesn’t trigger a **global** “FleetPulse encountered an error” + reload. Keep any global boundary for true top-level failures only; avoid auto-reload on every error.

- **Intro / first-load overlay**  
  If the first-load experience uses a video or heavy asset, always have a **failsafe** (e.g. timeout) and ideally a **fallback path** or skip so users never sit on a blank or purple screen for more than a few seconds.

- **Asset and import paths**  
  When moving components (e.g. into `layout/`, `animations/`, `marketing/`) or assets (e.g. into `branding/`, `animations/`), update **all** references and confirm paths match the actual folder names (including casing, e.g. `animations` vs `Animations`). Check both code and `public/`.

- **Incremental validation**  
  After adding or removing a **root-level wrapper** (e.g. NavbarLayout, IntroAnimation), quickly re-check: does the landing still scroll? Does the dashboard still load? Run the checklist in §2 before considering the change set complete.

---

## 5. Where this is documented

- **Detailed breakage analysis:** `docs/BREAKAGE_ANALYSIS_CURRENT_VS_RESTORE_REFERENCE.md`
- **Restore reference usage:** `Restore Points/README.md`
- **AI/project context:** `AI_CONTEXT.md`
- **Cursor rule for layout/scroll:** `.cursor/rules/fleetpulse-layout-scroll.mdc` (reminds when editing relevant files)

---

*Last updated to prevent recurrence of the March 2025 layout/scroll/error breakage.*
