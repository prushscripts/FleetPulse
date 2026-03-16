/**
 * Canonical paths for animation assets.
 * - Intro (first visit): public/branding or public/animations
 * - Loop (transitions/loading): public/animations
 */
export const ANIMATIONS_BASE = '/animations'
export const BRANDING_BASE = '/branding'

/** Intro — plays once on first visit to landing. Use branding folder if file is there. */
export const INTRO_VIDEO = `${BRANDING_BASE}/officialfpanimation.mp4`
/** Fallback if intro is in animations instead of branding */
export const INTRO_VIDEO_FALLBACK = `${ANIMATIONS_BASE}/officialfpanimation.mp4`

/** Loop — plays during route transitions and loading overlays */
export const LOGO_LOOP_VIDEO = `${ANIMATIONS_BASE}/possiblelogoloop.mp4`
