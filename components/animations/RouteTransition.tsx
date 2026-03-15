'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LOADING_VIDEO_SRC, LOADING_VIDEO_SRC_FALLBACK } from './LoadingOverlay'

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
const MIN_VISIBLE_MS = 700
const FADE_OUT_MS = 300

export default function RouteTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [videoSrc, setVideoSrc] = useState(LOADING_VIDEO_SRC)
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
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none min-h-screen w-full"
      style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="rounded-xl shadow-2xl border border-white/10 backdrop-blur-lg p-6 flex flex-col items-center" style={{ background: 'rgba(15,15,25,0.85)' }}>
          <video
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            src={videoSrc}
            className="w-[140px] sm:w-[180px] h-auto object-contain opacity-90"
            style={{ background: 'transparent' }}
            aria-hidden
            onError={() => {
              if (videoSrc === LOADING_VIDEO_SRC) setVideoSrc(LOADING_VIDEO_SRC_FALLBACK)
            }}
          />
          {!exiting && (
            <p className="mt-4 text-xs font-light uppercase tracking-widest text-purple-300/90 text-center">
              Loading {loadingLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
