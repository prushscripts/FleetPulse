'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PageTransitionWrapper from '@/components/animations/PageTransitionWrapper'

const NAV_ROUTES = ['/home', '/dashboard']

function shouldShowNavbar(pathname: string): boolean {
  if (pathname === '/home') return true
  if (pathname.startsWith('/dashboard')) return true
  return false
}

/**
 * Renders Navbar once (when on /home or /dashboard*) and wraps page content in
 * PageTransitionWrapper. Navbar stays mounted across tab switches so layout
 * and underline animation remain stable.
 */
export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar = NAV_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  return (
    <>
      {showNavbar && <Navbar />}
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  )
}
