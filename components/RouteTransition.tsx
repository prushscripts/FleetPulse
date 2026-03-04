'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Dashboard routes that use TabSlideTransition instead
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
    // Skip transition overlay for dashboard routes (they use slide animation)
    if (isDashboardRoute(pathname)) {
      return
    }

    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 400)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pointer-events-none">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spinner"></div>
      </div>
    </div>
  )
}
