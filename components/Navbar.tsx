'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { NavbarView } from '@/components/NavbarView'
import { usePageTransitionContext } from '@/components/PageTransition'

export type Company = { id: string; name: string; displayName?: string; logoUrl?: string; roadmapOnly?: boolean }

type CompanySetting = {
  inspectionsEnabled?: boolean
  template?: string
  customTemplate?: { tabs?: string[] }
}

function isTabActive(pathname: string, href: string): boolean {
  if (href === '/home') return pathname.startsWith('/home')
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/vehicles')
  }
  return pathname.startsWith(href)
}

function companyLogoSlug(c: Company): string {
  let n = (c.displayName || c.name).toLowerCase()
  n = n.replace(/\s*(group|llc|inc|co|corp|ltd)\.?(\s*(group|llc|inc|co|corp|ltd)\.?)*\s*$/gi, '').trim()
  return n.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
}

const LOGO_EXTENSIONS = ['.png', '.jpg', '.jpeg']

function CompanyLogoImage({ company, className }: { company: Company; className?: string }) {
  const slug = companyLogoSlug(company)
  const [failed, setFailed] = useState(false)
  const [extIndex, setExtIndex] = useState(0)
  const ext = LOGO_EXTENSIONS[extIndex]
  const fallback = (
    <span className={`flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded ${className || 'w-7 h-7'}`} aria-hidden>
      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </span>
  )
  if (company.logoUrl && !failed) {
    return (
      <img
        src={company.logoUrl}
        alt=""
        className={className}
        onError={() => setFailed(true)}
      />
    )
  }
  if (failed || !slug) return fallback
  return (
    <img
      src={`/images/companylogos/${slug}${ext}`}
      alt=""
      className={className}
      onError={() => {
        if (extIndex < LOGO_EXTENSIONS.length - 1) setExtIndex((i) => i + 1)
        else setFailed(true)
      }}
    />
  )
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { navigateTo } = usePageTransitionContext()
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

  const [companySettings, setCompanySettings] = useState<CompanySetting | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.user_metadata?.is_admin === true)
      const list = user?.user_metadata?.companies as Company[] | undefined
      const cid = user?.user_metadata?.company_id as string | undefined
      const cname = user?.user_metadata?.company_name as string | undefined
      if (list?.length) {
        setCompanies(list)
        setCurrentCompanyId(cid ?? null)
      } else if (cid && cname) {
        setCompanies([{ id: cid, name: cname }])
        setCurrentCompanyId(cid)
      } else {
        setCompanies([])
        setCurrentCompanyId(null)
      }
      const settings = user?.user_metadata?.company_settings as Record<string, CompanySetting> | undefined
      const current = cid && settings?.[cid] ? settings[cid] : null
      setCompanySettings(current ?? null)
    }
    load()
  }, [supabase, pathname])

  const [switchingTo, setSwitchingTo] = useState<string | null>(null)

  const handleSwitchCompany = async (company: Company) => {
    if (company.id === currentCompanyId) {
      setCompanySwitcherOpen(false)
      return
    }
    try {
      const displayName = company.displayName ?? company.name
      await supabase.auth.updateUser({
        data: { company_id: company.id, company_name: displayName },
      })
      setCompanySwitcherOpen(false)
      setSwitchingTo(displayName)
      const isRoadmapOnly = company.roadmapOnly || (company.name || '').toLowerCase().includes('roadmap')
      setTimeout(() => {
        window.location.href = isRoadmapOnly ? '/dashboard/roadmap' : '/home'
      }, 420)
    } catch {
      setCompanySwitcherOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentCompany = companies.find((c) => c.id === currentCompanyId)
  const currentCompanyName = currentCompany?.displayName ?? currentCompany?.name ?? ''
  const showRoadmap = /prush/i.test(currentCompanyName)

  const inspectionsEnabled = companySettings?.inspectionsEnabled !== false
  const template = companySettings?.template ?? 'default'
  const customTabs = template === 'custom' && companySettings?.customTemplate?.tabs?.length
    ? companySettings.customTemplate.tabs
    : null

  const TAB_KEY_MAP = ((): Record<string, { label: string; href: string }> => ({
    home: { label: 'Home', href: '/home' },
    vehicles: { label: 'Vehicles', href: '/dashboard' },
    drivers: { label: 'Drivers', href: '/dashboard/drivers' },
    inspections: { label: 'Inspections', href: '/dashboard/inspections' },
    about: { label: 'About', href: '/dashboard/about' },
    roadmap: { label: 'Roadmap', href: '/dashboard/roadmap' },
    control_panel: { label: 'Control Panel', href: '/dashboard/control-panel' },
  }))()

  let navItems: { label: string; href: string }[]
  if (customTabs?.length) {
    navItems = customTabs
      .map((key) => TAB_KEY_MAP[key])
      .filter(Boolean) as { label: string; href: string }[]
    if (!navItems.some((i) => i.href === '/dashboard/settings')) {
      if (pathname.startsWith('/dashboard/settings')) {
        navItems.push({ label: 'Settings', href: '/dashboard/settings' })
      }
    }
  } else {
    navItems = [
      { label: 'Home', href: '/home' },
      { label: 'Vehicles', href: '/dashboard' },
      { label: 'Drivers', href: '/dashboard/drivers' },
      ...(inspectionsEnabled ? [{ label: 'Inspections', href: '/dashboard/inspections' }] : []),
      { label: 'About', href: '/dashboard/about' },
      ...(showRoadmap ? [{ label: 'Roadmap', href: '/dashboard/roadmap' }] : []),
      ...(currentCompanyId ? [{ label: 'Control Panel', href: '/dashboard/control-panel' }] : []),
    ]
    if (pathname.startsWith('/dashboard/settings')) {
      navItems.push({ label: 'Settings', href: '/dashboard/settings' })
    }
  }

  if (isAdmin && !navItems.some((i) => i.href === '/dashboard/admin')) {
    navItems.push({ label: 'Admin', href: '/dashboard/admin' })
  }

  return (
    <NavbarView
      switchingTo={switchingTo}
      navItems={navItems}
      pathname={pathname}
      isTabActive={(href) => isTabActive(pathname, href)}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      showCompanySwitcher={showCompanySwitcher}
      companies={companies}
      currentCompanyId={currentCompanyId}
      currentCompany={currentCompany}
      currentCompanyName={currentCompanyName}
      companySwitcherOpen={companySwitcherOpen}
      setCompanySwitcherOpen={setCompanySwitcherOpen}
      handleSwitchCompany={handleSwitchCompany}
      handleLogout={handleLogout}
      theme={theme}
      toggleTheme={toggleTheme}
      CompanyLogoImage={CompanyLogoImage}
      navigateTo={navigateTo}
    />
  )
}
