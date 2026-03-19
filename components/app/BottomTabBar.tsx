'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Activity, Truck, Users, ClipboardCheck } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { href: '/dashboard/fleet-health', label: 'Health', icon: Activity },
  { href: '/dashboard/home', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
  { href: '/dashboard/drivers', label: 'Drivers', icon: Users },
  { href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard/home') {
      return pathname === '/dashboard/home' || pathname === '/dashboard'
    }
    if (href === '/dashboard/vehicles') {
      return pathname === '/dashboard/vehicles' || pathname?.startsWith('/dashboard/vehicles/')
    }
    if (href === '/dashboard/fleet-health') {
      return pathname === '/dashboard/fleet-health' || pathname?.startsWith('/dashboard/fleet-health/')
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0F1E]/95 backdrop-blur-md border-t border-white/[0.08]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#0A0F1E]/80 to-transparent pointer-events-none" />
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <motion.div key={href + label} whileTap={{ scale: 0.9 }} className="relative">
              <Link
                href={href}
                className="flex flex-col items-center justify-center gap-1 relative min-h-[44px]"
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-x-3 inset-y-2 rounded-xl bg-blue-500/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  size={20}
                  className={`relative z-10 transition-colors duration-200 ${active ? 'text-blue-400' : 'text-slate-500'}`}
                />
                <span
                  className={`relative z-10 text-[11px] font-medium transition-colors duration-200 ${
                    active ? 'text-blue-400' : 'text-slate-600'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
