# Transparent FleetPulse logo animation

The app uses **two** logo video files so the logo can have a transparent background and still work everywhere:

1. **possibleLogoLoop_transparent.webm** (preferred) – WebM with **alpha channel** so the dark background is transparent. Only the FleetPulse text and pulse line are visible; the rest is transparent.
2. **possibleLogoLoop.mp4** (fallback) – Current MP4. Used when the WebM is missing or the browser doesn’t support it.

## Why WebM?

- **MP4 does not support transparency.** You cannot “make an MP4 transparent” in the browser.
- **WebM (VP9) with alpha** does. Browsers that support it will show the transparent version.
- The app is set up to load the WebM first; if it’s missing or fails, the MP4 is used.

## How to get a transparent version

1. **Remove the background** from your logo animation (dark grid, light shafts, etc.) so only the FleetPulse text and purple pulse line remain. Do this in:
   - **After Effects / Premiere / DaVinci Resolve:** Key out the dark background, export with alpha.
   - **Runway or similar:** “Remove background from video” then export. You may need to re-encode to WebM with alpha in an editor or with FFmpeg.

2. **Export as WebM with alpha (VP9):**
   - **FFmpeg** (after you have a video with alpha, e.g. MOV ProRes 4444):
     ```bash
     ffmpeg -i logo_with_alpha.mov -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 possibleLogoLoop_transparent.webm
     ```
   - Or in **After Effects:** Render via Media Encoder using WebM/VP9 and “Include Alpha” (or equivalent).

3. **Put the file here:**
   - Path: `public/Animations/possibleLogoLoop_transparent.webm`
   - The app will pick it up automatically. No code changes needed.

## Sizing (already set in the app)

- **Navbar:** Compact so it doesn’t cover nav items or look like a big box.
- **Login / Signup / Home / Entry:** Larger where the logo is the focus.
- If you need different sizes, we can tweak the CSS classes per page.
