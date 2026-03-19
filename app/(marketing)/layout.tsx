'use client'

import NavbarLayout from '@/components/layout/NavbarLayout'

/**
 * Marketing routes (/, /login, /signup, etc.) get the marketing LandingNavbar only.
 * Dashboard and driver routes use their own layout (AppShell/AppNavbar).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavbarLayout>
      <main>{children}</main>
    </NavbarLayout>
  )
}
