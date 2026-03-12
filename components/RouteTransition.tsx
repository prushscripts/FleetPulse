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
]

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export default function RouteTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (isDashboardRoute(pathname)) return
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 400)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(8,10,20,0.97)' }}
    >
      <video
        autoPlay
        muted
        playsInline
        className="w-full max-w-[480px] h-auto object-contain"
        style={{ mixBlendMode: 'screen' }}
        aria-hidden
      >
        <source src="/assets/fleetpulse_logo_loop.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
