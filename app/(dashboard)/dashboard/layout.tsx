'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/app/AppShell'
import DashboardErrorBoundary from './DashboardErrorBoundary'

/**
 * Dashboard layout: never block with a loading overlay so the page never goes blank.
 * Run redirects in the background (driver → /driver, no company → /welcome).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/dashboard/activate' || pathname === '/dashboard/settings' || pathname === '/dashboard/welcome' || pathname === '/dashboard/about') {
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const role = user.user_metadata?.role as string | undefined
      if (role === 'driver') {
        router.replace('/driver')
        return
      }
      const companyId = user.user_metadata?.company_id
      if (!companyId) {
        router.replace('/dashboard/welcome')
      }
    }).catch(() => { /* ignore so layout never throws */ })
  }, [pathname, router])

  return (
    <DashboardErrorBoundary>
      <AppShell>
        <div key={pathname} className="animate-tab-enter w-full relative">
          {children}
        </div>
      </AppShell>
    </DashboardErrorBoundary>
  )
}
