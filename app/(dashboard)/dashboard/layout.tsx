'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/app/AppShell'
import DashboardErrorBoundary from './DashboardErrorBoundary'

const MAX_ATTEMPTS = 6
const RETRY_MS = 500

/**
 * Dashboard layout: retry auth up to ~3s to avoid blank screen after login
 * (session cookie may not be set immediately). Then run redirects (driver → /driver, no company → /welcome).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; user_metadata?: Record<string, unknown> } | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let attempts = 0

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setChecked(true)
        return
      }
      if (attempts < MAX_ATTEMPTS) {
        attempts += 1
        setTimeout(checkAuth, RETRY_MS)
      } else {
        window.location.href = '/login'
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!user || !checked) return
    if (pathname === '/dashboard/activate' || pathname === '/dashboard/settings' || pathname === '/dashboard/welcome' || pathname === '/dashboard/about') {
      return
    }
    const role = user.user_metadata?.role as string | undefined
    if (role === 'driver') {
      router.replace('/driver')
      return
    }
    const companyId = user.user_metadata?.company_id
    if (!companyId) {
      router.replace('/dashboard/welcome')
    }
  }, [user, checked, pathname, router])

  if (!checked) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/branding/fleetpulse-navbar.png"
            alt="FleetPulse"
            width={140}
            height={32}
            className="h-8 w-auto opacity-60"
          />
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent animate-pulse" />
        </div>
      </div>
    )
  }

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
