'use client'

import { usePathname } from 'next/navigation'
import LandingNavbar from '@/components/layout/LandingNavbar'
import PageTransitionWrapper from '@/components/animations/PageTransitionWrapper'
import RouteTransition from '@/components/animations/RouteTransition'

const LANDING_PATHS = ['/', '/login', '/signup', '/privacy', '/terms', '/forgot-password', '/reset-password']
const DASHBOARD_ROUTES = ['/dashboard', '/driver']

/**
 * Marketing layout only. Renders public LandingNavbar (no auth, no avatar).
 * Dashboard/driver use their own layout (AppShell/AppNavbar).
 */
export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboardOrDriver = DASHBOARD_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const showLandingNav =
    !isDashboardOrDriver && LANDING_PATHS.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')))

  return (
    <>
      <RouteTransition />
      {showLandingNav && <LandingNavbar />}
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  )
}
