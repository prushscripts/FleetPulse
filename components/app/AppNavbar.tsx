'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Users,
  ClipboardCheck,
  Info,
  Settings,
  Shield,
  ChevronDown,
  LogOut,
  Bell,
  LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard', label: 'Vehicles', icon: Truck },
  { href: '/dashboard/drivers', label: 'Drivers', icon: Users },
  { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/dashboard/about', label: 'About', icon: Info },
]

export default function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<{ email?: string; companyName?: string; plan?: string; initial?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      const companyName = (u.user_metadata?.company_name as string) || (u.user_metadata?.company_id as string) || 'Account'
      const plan = (u.user_metadata?.subscription_tier as string) || 'Professional'
      const initial = (companyName || u.email || 'U').charAt(0).toUpperCase()
      setUser({
        email: u.email,
        companyName,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() + ' Plan',
        initial,
      })
    })
  }, [supabase])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', onOutside)
      return () => document.removeEventListener('mousedown', onOutside)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname?.startsWith('/dashboard/vehicles')
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0A0F1E]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 mr-8 flex-shrink-0">
        <Image
          src="/branding/fleetpulse-navbar.png"
          alt="FleetPulse"
          width={1600}
          height={410}
          className="h-10 w-auto"
        />
      </Link>

      <div className="hidden md:flex items-center gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href + label}
              href={href}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 group min-h-[44px] min-w-[44px] ${
                active ? 'text-white bg-white/[0.06]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
              {label}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all min-h-[44px]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.initial ?? 'U'}
            </div>
            <ChevronDown size={13} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[#0F1629] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <div className="text-xs font-medium text-white">My Account</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{user?.plan ?? 'Professional Plan'}</div>
                </div>
                <div className="p-1">
                  <Link
                    href="/dashboard/control-panel"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Settings size={14} className="text-slate-500" />
                    Control Panel
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Shield size={14} className="text-slate-500" />
                    Admin
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] rounded-lg transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  )
}
