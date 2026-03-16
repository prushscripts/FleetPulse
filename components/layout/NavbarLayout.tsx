'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import PageTransitionWrapper from '@/components/animations/PageTransitionWrapper'
import RouteTransition from '@/components/animations/RouteTransition'
import { isPreviewPath } from '@/lib/preview-routes'

const NAV_ROUTES = ['/home', '/dashboard']

/**
 * Renders Navbar once (when on /home, /dashboard*, or temporary preview routes)
 * and wraps page content in PageTransitionWrapper. On mobile, also shows bottom tab bar.
 * RouteTransition shows branded logo loop during route changes.
 */
export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar =
    NAV_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    isPreviewPath(pathname)

  return (
    <>
      <RouteTransition />
      {showNavbar && <Navbar />}
      {showNavbar && <MobileBottomNav />}
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  )
}
