/**
 * Temporary public preview routes: same content as dashboard tabs, no login required.
 * Remove or guard when no longer needed.
 */

export const PREVIEW_PATHS = [
  '/vehicles',
  '/drivers',
  '/inspections',
  '/roadmap',
  '/about',
  '/admin',
  '/control-panel',
] as const

export function isPreviewPath(pathname: string): boolean {
  return PREVIEW_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}
