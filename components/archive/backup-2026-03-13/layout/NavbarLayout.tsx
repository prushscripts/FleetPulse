'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PageTransitionWrapper from '@/components/animations/PageTransitionWrapper'
import { isPreviewPath } from '@/lib/preview-routes'

const NAV_ROUTES = ['/home', '/dashboard']

/**
 * Renders Navbar once (when on /home, /dashboard*, or temporary preview routes)
 * and wraps page content in PageTransitionWrapper.
 */
export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar =
    NAV_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/')) ||
    isPreviewPath(pathname)

  return (
    <>
      {showNavbar && <Navbar />}
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  )
}
