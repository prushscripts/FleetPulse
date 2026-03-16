'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/app/AppShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activationChecked, setActivationChecked] = useState(false)

  useEffect(() => {
    if (pathname === '/dashboard/activate' || pathname === '/dashboard/settings' || pathname === '/dashboard/welcome' || pathname === '/dashboard/about') {
      setActivationChecked(true)
      return
    }
    let cancelled = false
    const supabase = createClient()
    // Safety: stop blocking after 2.5s so we never show a permanent blank screen
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setActivationChecked(true)
    }, 2500)
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return
        // If no user on client, don't block — server already validated auth for this route
        if (!user) {
          setActivationChecked(true)
          return
        }
        // Only send to driver portal when role is explicitly 'driver' (not undefined/null)
        const role = user.user_metadata?.role as string | undefined
        if (role === 'driver') {
          router.replace('/driver')
          return
        }
        const companyId = user.user_metadata?.company_id
        if (!companyId) {
          router.replace('/dashboard/welcome')
          return
        }
        setActivationChecked(true)
      })
      .catch((err) => {
        if (cancelled) return
        if (typeof console !== 'undefined') console.error('[FleetPulse] dashboard layout auth check failed:', err)
        setActivationChecked(true)
      })
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [pathname, router])

  const showLoadingOverlay =
    !activationChecked &&
    pathname !== '/dashboard/activate' &&
    pathname !== '/dashboard/welcome' &&
    pathname !== '/dashboard/about'

  return (
    <AppShell>
      {showLoadingOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0F1E] min-h-screen">
          <div className="text-slate-400 text-sm">Loading…</div>
        </div>
      )}
      <div key={pathname} className="animate-tab-enter w-full relative">
        {children}
      </div>
    </AppShell>
  )
}
