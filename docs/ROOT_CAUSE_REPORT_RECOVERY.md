# Root Cause Report: FleetPulse Recovery (Codex + Cursor)

Short report from the recovery work driven by the Codex prompt and implemented in Cursor.

---

## 1. Exact crash cause (dashboard “FleetPulse encountered an error”)

- **Primary:** In `DashboardClient.tsx`, several places used `vehicle.code.toLowerCase()` and `territoryMap[vehicle.code.toLowerCase()]` without guarding against `vehicle.code` being `null` or `undefined`. When the API returned a vehicle with no `code`, this threw at runtime and was caught by the global ErrorBoundary.
- **Secondary:** `lib/supabase/client.ts` used non-null assertion on `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`. In environments where those env vars were missing, `createBrowserClient` could throw, again triggering the global ErrorBoundary.
- **Amplifier:** The global `ErrorBoundary` auto-reloaded after 2s and showed only “FleetPulse encountered an error. Reloading…”, which hid the real error and could create a reload loop.

---

## 2. Files changed in this recovery

### Stability / crash fix
- **`components/ErrorBoundary.tsx`** — Removed automatic reload loop. In development, show error message and component stack. In production, show a fallback with a manual “Reload page” button. No more auto-reload.
- **`app/(dashboard)/dashboard/DashboardClient.tsx`** — (Already fixed earlier) Safe access for `vehicle.code`: `vehicle.code?.toLowerCase() ?? ''` and `getTerritory` use a guarded `code` variable.
- **`lib/supabase/client.ts`** — (Already fixed earlier) Use `?? ''` for URL and anon key so `createClient()` never throws on missing env.
- **`app/(dashboard)/dashboard/DashboardErrorBoundary.tsx`** — (Already added earlier) Local boundary so dashboard errors show “Dashboard couldn’t load” with Refresh/Back to home instead of the global screen.
- **`tsconfig.json`** — Excluded `Restore Points` so the restore reference folder is not compiled and cannot cause build errors.

### Animation asset normalization
- **`lib/animation-paths.ts`** — New constants module. Canonical paths: `INTRO_VIDEO = '/animations/officialfpanimation.mp4'`, `LOGO_LOOP_VIDEO = '/animations/possiblelogoloop.mp4'`. All animation references use this module (lowercase filenames after HandBrake optimization).
- **`components/IntroAnimationOverlay.tsx`** — Uses `INTRO_VIDEO` from `@/lib/animation-paths`; removed fallback path and `onError` fallback. Added `prefers-reduced-motion` check: skip intro when user prefers reduced motion.
- **`components/marketing/LandingIntro.tsx`** — Uses `INTRO_VIDEO`; removed fallback and `onError` fallback.
- **`components/animations/LoadingOverlay.tsx`** — Uses `LOGO_LOOP_VIDEO`; removed fallback and `onError` fallback. Re-exports `LOADING_VIDEO_SRC` from the constant for backwards compatibility.
- **`app/(marketing)/login/page.tsx`** — Uses `LOGO_LOOP_VIDEO`; removed fallback and `onError` fallback.
- **`components/animations/EntryAnimation.tsx`** — Uses `LOGO_LOOP_VIDEO` for the video source.

### Prompt and docs
- **`docs/prompts/CURSOR_RESTORE_AND_UX_FIX_PROMPT.md`** — Saved the Codex prompt for Cursor as requested.
- **`docs/ROOT_CAUSE_REPORT_RECOVERY.md`** — This report.

---

## 3. Why the regression occurred

- **Layout and scroll:** Root layout was refactored (ErrorBoundary, IntroAnimation, NavbarLayout, etc.) without ensuring the document/body remained the only scroll container. Components that depend on `window.scrollY` (ScrollBlur, FloatingLoginCard, ScrollToTop) could break when scroll was trapped or the tree changed.
- **Error handling:** A global ErrorBoundary was added and set to auto-reload. Any single component throw (e.g. dashboard) then produced the same “FleetPulse encountered an error” + reload and hid the real cause.
- **Data safety:** Dashboard assumed every vehicle had a non-null `code`; the API or data shape did not guarantee that, so one bad row caused a throw.
- **Asset paths:** Animation paths were used with mixed casing and fallbacks (`/animations/` vs `/Animations/`). On case-sensitive hosts or with inconsistent `public/` layout, this could cause 404s or confusion.

---

## 4. How it was fixed

- **Crash:** Optional chaining and defaults for `vehicle.code` in DashboardClient; non-throwing Supabase client; dashboard wrapped in DashboardErrorBoundary; global ErrorBoundary no longer auto-reloads and shows dev debug info.
- **Animation paths:** Single canonical folder `public/animations` (lowercase) and a single source of truth in `lib/animation-paths.ts`. All consumers import from there; fallback logic and duplicate paths removed.
- **Build:** Restore reference excluded from TypeScript so it is not compiled.

---

## 5. What’s left (from the Codex prompt)

- **Intro polish:** First-visit, preload, zoom/blur/pulse/reveal sequence is partially in place; `prefers-reduced-motion` skip added. Further polish (e.g. preload to avoid flash) can be done in a follow-up.
- **Landing hero redesign + scroll:** Scroll behavior (login minimize, back-to-top) depends on document scroll; if issues remain, ensure no wrapper traps scroll (see `docs/SAFE_CHANGES_GUARDRAILS.md`).
- **Login → dashboard transition:** Login page already uses `LOGO_LOOP_VIDEO`; full “auth success → branded transition → dashboard” without full reload may require a dedicated post-login route or client-side transition.
- **Regression audit:** `docs/BREAKAGE_ANALYSIS_CURRENT_VS_RESTORE_REFERENCE.md` and `docs/SAFE_CHANGES_GUARDRAILS.md` document differences and guardrails.

---

*Report generated as part of the FleetPulse recovery (Codex prompt + Cursor implementation).*
