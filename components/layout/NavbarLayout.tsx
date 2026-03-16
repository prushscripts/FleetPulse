'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import PageTransitionWrapper from '@/components/animations/PageTransitionWrapper'
import RouteTransition from '@/components/animations/RouteTransition'

const LANDING_PATHS = ['/', '/login', '/signup', '/privacy', '/terms']
const DASHBOARD_ROUTES = ['/dashboard', '/driver']

/**
 * Renders nav: on dashboard/driver use AppShell (inside their layout);
 * on landing paths only use legacy Navbar + MobileBottomNav.
 */
export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboardOrDriver = DASHBOARD_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  const showLegacyNav =
    !isDashboardOrDriver && LANDING_PATHS.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')))

  return (
    <>
      <RouteTransition />
      {showLegacyNav && <Navbar />}
      {showLegacyNav && <MobileBottomNav />}
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  )
}
