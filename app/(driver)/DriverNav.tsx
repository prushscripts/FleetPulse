'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function DriverNav() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[#0A0F1E]/95 backdrop-blur border-b border-white/[0.06]">
      <Link href="/driver" className="text-lg font-semibold text-white tracking-tight">
        FleetPulse
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </header>
  )
}
