/**
 * Canonical paths for animation assets.
 * All current MP4s live in public/animations.
 */
export const ANIMATIONS_BASE = '/animations'

/** Intro — plays once on first visit to landing. */
export const INTRO_VIDEO = `${ANIMATIONS_BASE}/officialfpanimation.mp4`
/** Fallback kept for compatibility (same as primary for now). */
export const INTRO_VIDEO_FALLBACK = `${ANIMATIONS_BASE}/officialfpanimation.mp4`

/** Loop — plays during route transitions and loading overlays */
export const LOGO_LOOP_VIDEO = `${ANIMATIONS_BASE}/possiblelogoloop.mp4`
