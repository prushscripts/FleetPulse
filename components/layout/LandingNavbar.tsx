'use client'

import Link from 'next/link'
import Image from 'next/image'

/**
 * Public-only navbar for landing pages. No auth check, no user avatar.
 * Always shows: Features | Pricing | Sign in | Start free trial
 */
const PUBLIC_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Sign in', href: '/login' },
  { label: 'Start free trial', href: '/signup' },
]

export default function LandingNavbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 min-h-[64px] flex items-center justify-between px-4 sm:px-7 bg-[#0A0F1E]/95 backdrop-blur-md border-b border-white/[0.06]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link href="/" className="flex items-center flex-shrink-0 h-10 w-auto">
        <Image
          src="/branding/fleetpulse-navbar.png"
          alt="FleetPulse"
          width={1600}
          height={410}
          className="h-10 w-auto object-contain object-left"
          priority
        />
      </Link>
      <div className="hidden sm:flex items-center gap-1">
        {PUBLIC_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex sm:hidden items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-3 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30"
        >
          Start free trial
        </Link>
      </div>
    </nav>
  )
}
