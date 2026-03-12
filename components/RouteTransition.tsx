'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

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
  const [opacity, setOpacity] = useState(0)
  const [exiting, setExiting] = useState(false)
  const loadingLabel = ROUTE_LABEL_MAP[pathname] ?? 'Page'

  useEffect(() => {
    if (isDashboardRoute(pathname)) return
    setIsTransitioning(true)
    setExiting(false)
    setOpacity(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpacity(1))
    })
    const minTimer = setTimeout(() => {
      setExiting(true)
      setOpacity(0)
    }, FADE_IN_MS + MIN_VISIBLE_MS)
    const hideTimer = setTimeout(() => setIsTransitioning(false), FADE_IN_MS + MIN_VISIBLE_MS + FADE_OUT_MS)
    return () => {
      clearTimeout(minTimer)
      clearTimeout(hideTimer)
    }
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
      style={{
        background: '#080a14',
        opacity,
        transition: exiting ? `opacity ${FADE_OUT_MS}ms ease-out, transform ${FADE_OUT_MS}ms ease-out` : `opacity ${FADE_IN_MS}ms ease-out`,
        transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      <p
        className="text-sm font-light uppercase mb-6 text-purple-300/70"
        style={{ letterSpacing: '0.3em' }}
      >
        Loading {loadingLabel}...
      </p>
      <video
        autoPlay
        muted
        playsInline
        style={{
          width: '320px',
          height: 'auto',
          mixBlendMode: 'screen',
          background: 'transparent',
          display: 'block',
        }}
        aria-hidden
      >
        <source src="/assets/fleetpulse_logo_loop.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
