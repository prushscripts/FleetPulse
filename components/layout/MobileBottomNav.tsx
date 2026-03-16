'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Truck, Users, ClipboardCheck } from 'lucide-react'

const TABS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Vehicles', href: '/dashboard', icon: Truck },
  { label: 'Drivers', href: '/dashboard/drivers', icon: Users },
  { label: 'Inspections', href: '/dashboard/inspections', icon: ClipboardCheck },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname?.startsWith('/dashboard/vehicles')
    return pathname?.startsWith(href)
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-navy-900/95 backdrop-blur-md border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href + label}
            href={href}
            className="flex flex-col items-center justify-center gap-1 py-3 px-4 min-h-[56px] min-w-[64px] transition-colors"
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} className={active ? 'text-blue-400' : 'text-slate-500'} />
            <span className={`text-[11px] font-medium ${active ? 'text-blue-400' : 'text-slate-500'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
