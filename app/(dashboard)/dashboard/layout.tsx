'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [activationChecked, setActivationChecked] = useState(false)

  // Redirect unassigned users to welcome (except when on activate, settings, welcome, or about)
  useEffect(() => {
    if (pathname === '/dashboard/activate' || pathname === '/dashboard/settings' || pathname === '/dashboard/welcome' || pathname === '/dashboard/about') {
      setActivationChecked(true)
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const companyId = user?.user_metadata?.company_id
      if (user && !companyId) {
        router.replace('/dashboard/welcome')
        return
      }
      setActivationChecked(true)
    })
  }, [pathname, router])

  // Avoid flash of dashboard content before activation redirect
  if (!activationChecked && pathname !== '/dashboard/activate' && pathname !== '/dashboard/welcome' && pathname !== '/dashboard/about') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="w-full pt-[64px]">
      {children}
    </div>
  )
}
