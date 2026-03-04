'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [routeAnimating, setRouteAnimating] = useState(false)
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { label: 'Home', href: '/home' },
    { label: 'Vehicles', href: '/dashboard' },
    { label: 'Drivers', href: '/dashboard/drivers' },
    { label: 'Inspections', href: '/dashboard/inspections' },
    { label: 'About', href: '/dashboard/about' },
  ]

  if (pathname.startsWith('/dashboard/settings')) {
    navItems.push({ label: 'Settings', href: '/dashboard/settings' })
  }

  const isTabActive = (href: string) => {
    if (href === '/home') return pathname.startsWith('/home')
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/vehicles')
    }
    return pathname.startsWith(href)
  }

  const startRouteAnimation = () => {
    setRouteAnimating(true)
  }

  // Stop animation shortly after route settles.
  useEffect(() => {
    if (!routeAnimating) return
    const timer = window.setTimeout(() => setRouteAnimating(false), 350)
    return () => window.clearTimeout(timer)
  }, [pathname, routeAnimating])

  return (
    <nav className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="flex items-center gap-2 group">
                <Image
                  src="/fplogo.png"
                  alt="FleetPulse"
                  width={120}
                  height={40}
                  className="h-7 w-auto transition-transform duration-200 group-hover:scale-105"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-0.5">
              {navItems.map((item) => {
                const active = isTabActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={startRouteAnimation}
                    className={`relative inline-flex items-center px-4 py-2.5 text-xs tracking-wide rounded-t-lg transition-all duration-250 ${
                      active
                        ? 'text-gray-900 dark:text-white font-semibold bg-gradient-to-b from-indigo-50/60 to-transparent dark:from-indigo-900/30'
                        : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute left-2 right-2 bottom-0 h-0.5 rounded-full transition-all duration-250 ${
                        active ? 'bg-indigo-500 opacity-100' : 'bg-transparent opacity-0'
                      }`}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              href="/dashboard/settings"
                onClick={startRouteAnimation}
              className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                pathname.startsWith('/dashboard/settings')
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 tracking-wide"
            >
              Logout
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden pb-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 p-2 space-y-1">
              {navItems.map((item) => {
                const active = isTabActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMobileOpen(false)
                      startRouteAnimation()
                    }}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <Link
                href="/dashboard/settings"
                onClick={() => {
                  setMobileOpen(false)
                  startRouteAnimation()
                }}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname.startsWith('/dashboard/settings')
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </div>
      <div
        className={`absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 transition-all duration-500 ${
          routeAnimating ? 'w-full opacity-100' : 'w-0 opacity-0'
        }`}
      />
    </nav>
  )
}
