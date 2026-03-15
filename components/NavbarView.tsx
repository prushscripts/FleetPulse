'use client'

import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Company } from '@/components/layout/Navbar'

const NAV_HEIGHT = '64px'

function getNavStyle(scrolled?: boolean) {
  return {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: NAV_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    padding: '0 28px',
    background: 'rgba(8,12,28,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: scrolled ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(139, 92, 246, 0.15)',
    overflow: 'visible',
  }
}

function truncateName(name: string | null | undefined, max = 14) {
  if (!name) return 'Company'
  return name.length > max ? name.slice(0, max) + '…' : name
}

export type NavbarViewProps = {
  navItems: { label: string; href: string }[]
  pathname: string
  isTabActive: (href: string) => boolean
  mobileOpen: boolean
  setMobileOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  showCompanySwitcher: boolean
  companies: Company[]
  currentCompanyId: string | null
  currentCompany: Company | undefined
  currentCompanyName: string
  companySwitcherOpen: boolean
  setCompanySwitcherOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  handleSwitchCompany: (company: Company) => void
  handleLogout: () => void
  theme: string
  toggleTheme: () => void
  CompanyLogoImage: React.ComponentType<{ company: Company; className?: string }>
  navigateTo: (href: string) => void
  scrolled?: boolean
  companyConfig?: Record<string, unknown> | null
}

export function NavbarView(props: NavbarViewProps) {
  const CompanyLogoImage = props.CompanyLogoImage
  const navStyle = getNavStyle(props.scrolled)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    if (profileOpen) {
      document.addEventListener('mousedown', onOutside)
      return () => document.removeEventListener('mousedown', onOutside)
    }
  }, [profileOpen])

  useEffect(() => {
    if (props.mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [props.mobileOpen])
  const profileInitial = (props.currentCompanyName || 'U').charAt(0).toUpperCase()
  return (
    <div className="navbar-root overflow-visible">
      <nav style={navStyle}>
        <div className="max-w-7xl mx-auto w-full max-w-[100vw] flex justify-between items-center" style={{ height: '100%' }}>
          <Link
            href="/home"
            onClick={(e) => { e.preventDefault(); props.navigateTo('/home') }}
            className="flex items-center flex-shrink-0 h-7 sm:h-8 w-auto max-w-[220px] rounded-md overflow-hidden py-1 pr-2"
            style={{ background: 'transparent', textDecoration: 'none' }}
            aria-label="FleetPulse home"
          >
            <img
              src="/branding/fleetpulse-navbar.png"
              alt="FleetPulse"
              className="h-full w-auto max-w-[220px] object-contain object-left"
              width={220}
              height={32}
            />
          </Link>
          <div className="hidden sm:flex sm:flex-1 sm:justify-center sm:items-center sm:gap-1">
            {props.navItems.map((item) => {
              const active = props.isTabActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); props.navigateTo(item.href) }}
                  className="relative inline-flex items-center px-5 py-3.5 text-[13px] font-semibold transition-colors duration-[180ms] ease-out text-white/55 hover:text-white/90"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[rgba(139,92,246,0.9)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className={`relative z-10 ${active ? 'text-white' : ''}`}>{item.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-6 w-[88px] sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => props.setMobileOpen((v) => !v)}
              className="sm:hidden p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all w-8 h-8 flex items-center justify-center flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div
              className="relative hidden sm:block min-w-[180px] flex-shrink-0"
              style={props.showCompanySwitcher ? undefined : { opacity: 0, pointerEvents: 'none' }}
              aria-hidden={!props.showCompanySwitcher}
            >
              <button
                type="button"
                onClick={() => props.setCompanySwitcherOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:border-white/20 transition-all w-full min-w-[180px]"
                aria-label="Switch company"
              >
                <span className="max-w-[140px] truncate">{truncateName(props.currentCompanyName || 'Company', 14)}</span>
                <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${props.companySwitcherOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {props.companySwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-30" aria-hidden onClick={() => props.setCompanySwitcherOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-40 min-w-[200px] py-1.5 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-md shadow-xl">
                    {props.companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => props.handleSwitchCompany(c)}
                        className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                      >
                        {c.id === props.currentCompanyId ? (
                          <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" aria-hidden />
                        ) : (
                          <span className="w-2 h-2 flex-shrink-0" aria-hidden />
                        )}
                        <span className="truncate flex-1">{c.displayName ?? c.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link
              href="/dashboard/settings"
              onClick={(e) => { e.preventDefault(); props.navigateTo('/dashboard/settings') }}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all flex-shrink-0"
              title="Settings"
              aria-label="Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={props.toggleTheme}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition-all flex-shrink-0"
              aria-label="Toggle theme"
            >
              {props.theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 hover:bg-indigo-600/60 transition-all"
                aria-label="Profile menu"
              >
                {profileInitial}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 min-w-[120px] py-1 rounded-lg border border-white/10 bg-gray-900/95 backdrop-blur-md shadow-xl">
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); props.handleLogout() }}
                    className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {props.mobileOpen && (
          <div
            className="sm:hidden pb-3 pt-2 animate-fade-in-scale overflow-y-auto overflow-x-hidden max-h-[calc(100vh-64px)] max-w-[100vw] w-full mx-auto"
            style={{ maxWidth: '100vw' }}
          >
            <div className="rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-md shadow-xl p-3 space-y-2 w-full max-w-[100%] box-border mx-auto">
              {props.showCompanySwitcher && (
                <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 block mb-2">Company</span>
                  <div className="space-y-1">
                    {props.companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { props.handleSwitchCompany(c); props.setMobileOpen(false) }}
                        className={`w-full flex items-center gap-3 justify-between rounded-xl px-4 py-2.5 text-sm ${
                          c.id === props.currentCompanyId
                            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <CompanyLogoImage company={c} className="w-6 h-6 rounded flex-shrink-0 object-contain bg-gray-100 dark:bg-gray-700" />
                        <span className="truncate flex-1 text-left">{c.displayName ?? c.name}</span>
                        {c.id === props.currentCompanyId && (
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
                  onClick={() => props.setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1.5">
                {props.navItems.map((item, idx) => {
                  const active = props.isTabActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => { e.preventDefault(); props.setMobileOpen(false); props.navigateTo(item.href) }}
                      className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
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
                        {item.label === 'Roadmap' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        {item.label === 'Control Panel' && (
                          <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                  onClick={(e) => { e.preventDefault(); props.setMobileOpen(false); props.navigateTo('/dashboard/settings') }}
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    props.pathname.startsWith('/dashboard/settings')
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    props.pathname.startsWith('/dashboard/settings')
                      ? 'bg-white/20'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                  }`}>
                    <svg className={`w-4 h-4 ${props.pathname.startsWith('/dashboard/settings') ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="flex-1">Settings</span>
                  {props.pathname.startsWith('/dashboard/settings') && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => { props.setMobileOpen(false); props.handleLogout() }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
                >
                  <span className="flex-1 text-left">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
