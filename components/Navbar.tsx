'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

type Company = { id: string; name: string }

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null)
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false)
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const showCompanySwitcher =
    (pathname.startsWith('/dashboard') || pathname.startsWith('/home')) &&
    companies.length >= 2

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.user_metadata?.is_admin === true)
      const list = user?.user_metadata?.companies as Company[] | undefined
      const cid = user?.user_metadata?.company_id as string | undefined
      if (list?.length) {
        setCompanies(list)
        setCurrentCompanyId(cid ?? null)
      } else if (cid && user?.user_metadata?.company_name) {
        setCompanies([{ id: cid, name: user.user_metadata.company_name }])
        setCurrentCompanyId(cid)
      } else {
        setCompanies([])
        setCurrentCompanyId(null)
      }
    }
    load()
  }, [supabase, pathname])

  const handleSwitchCompany = async (company: Company) => {
    if (company.id === currentCompanyId) {
      setCompanySwitcherOpen(false)
      return
    }
    try {
      await supabase.auth.updateUser({
        data: { company_id: company.id, company_name: company.name },
      })
      setCurrentCompanyId(company.id)
      setCompanySwitcherOpen(false)
      router.refresh()
    } catch {
      setCompanySwitcherOpen(false)
    }
  }

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

  if (isAdmin) {
    navItems.push({ label: 'Admin', href: '/dashboard/admin' })
  }

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


  return (
    <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-sm border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-h-[4rem]">
          {/* Logo zone: centered in left section so tagline is readable */}
          <div className="flex items-center justify-start sm:justify-center min-w-[200px] sm:min-w-[280px] flex-shrink-0">
            <Link href="/home" className="flex items-center justify-center group">
              <Image
                src="/images/banner1.png"
                alt="FleetPulse"
                width={400}
                height={160}
                className="h-14 sm:h-[4rem] max-w-[280px] sm:max-w-[360px] w-auto transition-transform duration-200 group-hover:scale-105 object-contain object-center"
                priority
                unoptimized
              />
            </Link>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:justify-center sm:items-center sm:space-x-0.5">
              {navItems.map((item) => {
                const active = isTabActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
          <div className="flex items-center gap-3 flex-shrink-0">
            {showCompanySwitcher && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setCompanySwitcherOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm"
                  aria-label="Switch company"
                >
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5. M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="max-w-[140px] truncate">
                    {companies.find((c) => c.id === currentCompanyId)?.name ?? 'Company'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${companySwitcherOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {companySwitcherOpen && (
                  <>
                    <div className="fixed inset-0 z-30" aria-hidden onClick={() => setCompanySwitcherOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-40 min-w-[200px] py-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl">
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSwitchCompany(c)}
                          className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2.5 text-sm transition-colors ${
                            c.id === currentCompanyId
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/80'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {c.id === currentCompanyId && (
                            <svg className="w-4 h-4 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
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
        </div>

        {mobileOpen && (
          <div className="sm:hidden pb-3 animate-fade-in-scale">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl p-3 space-y-2">
              {showCompanySwitcher && (
                <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 block mb-2">Company</span>
                  <div className="space-y-1">
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { handleSwitchCompany(c); setMobileOpen(false) }}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                          c.id === currentCompanyId
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {c.id === currentCompanyId && (
                          <svg className="w-4 h-4 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Navigation</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1.5">
                {navItems.map((item, idx) => {
                  const active = isTabActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                    onClick={() => {
                      setMobileOpen(false)
                    }}
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Icon based on label */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        active
                          ? 'bg-white/20'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                      }`}>
                        {item.label === 'Home' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )}
                        {item.label === 'Vehicles' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                        {item.label === 'Drivers' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                        {item.label === 'Inspections' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {item.label === 'About' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {item.label === 'Admin' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  )
                })}
                <Link
                  href="/dashboard/settings"
                    onClick={() => {
                      setMobileOpen(false)
                    }}
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    pathname.startsWith('/dashboard/settings')
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    pathname.startsWith('/dashboard/settings')
                      ? 'bg-white/20'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                  }`}>
                    <svg className={`w-4 h-4 ${pathname.startsWith('/dashboard/settings') ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="flex-1">Settings</span>
                  {pathname.startsWith('/dashboard/settings') && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
