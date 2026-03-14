'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LOADING_VIDEO_SRC } from './LoadingOverlay'

const DASHBOARD_ROUTES = [
  '/home',
  '/dashboard',
  '/dashboard/drivers',
  '/dashboard/inspections',
  '/dashboard/about',
  '/dashboard/admin',
  '/dashboard/settings',
  '/dashboard/vehicles',
  '/dashboard/roadmap',
  '/dashboard/control-panel',
]

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

const ROUTE_LABEL_MAP: Record<string, string> = {
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/': 'Home',
}

const FADE_IN_MS = 150
const MIN_VISIBLE_MS = 400
const FADE_OUT_MS = 300

export default function RouteTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const loadingLabel = ROUTE_LABEL_MAP[pathname] ?? 'Page'

  useEffect(() => {
    if (isDashboardRoute(pathname)) return
    setIsTransitioning(true)
    setExiting(false)
    const minTimer = setTimeout(() => {
      setExiting(true)
    }, FADE_IN_MS + MIN_VISIBLE_MS)
    const hideTimer = setTimeout(() => {
      setIsTransitioning(false)
      setExiting(false)
    }, FADE_IN_MS + MIN_VISIBLE_MS + FADE_OUT_MS)
    return () => {
      clearTimeout(minTimer)
      clearTimeout(hideTimer)
    }
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none min-h-screen w-full"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 45%, rgba(30, 27, 75, 0.35) 0%, transparent 50%), linear-gradient(180deg, #060810 0%, #0a0e18 40%, #080c14 100%)',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
      }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="mb-8 flex justify-center">
          <video
            autoPlay
            muted
            playsInline
            loop
            className="max-w-[min(85vw,340px)] w-full h-auto block object-contain"
            style={{ mixBlendMode: 'screen', background: 'transparent' }}
            aria-hidden
          >
            <source src={LOADING_VIDEO_SRC} type="video/mp4" />
          </video>
        </div>
        {!exiting && (
          <>
            <p className="text-sm font-light uppercase tracking-[0.32em] text-purple-300/90 text-center">
              Loading {loadingLabel}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
