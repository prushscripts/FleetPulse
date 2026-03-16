'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/layout/ThemeProvider'
import { NavbarView } from '@/components/NavbarView'
import { usePageTransitionContext } from '@/components/animations/PageTransition'
import { isPreviewPath } from '@/lib/preview-routes'

export type Company = { id: string; name: string; displayName?: string; logoUrl?: string; roadmapOnly?: boolean }

type CompanySetting = {
  inspectionsEnabled?: boolean
  template?: string
  customTemplate?: { tabs?: string[] }
}

/** Preview path equivalents for dashboard routes (temporary no-login view). */
const DASHBOARD_TO_PREVIEW: Record<string, string> = {
  '/dashboard': '/vehicles',
  '/dashboard/drivers': '/drivers',
  '/dashboard/inspections': '/inspections',
  '/dashboard/about': '/about',
  '/dashboard/roadmap': '/roadmap',
  '/dashboard/control-panel': '/control-panel',
  '/dashboard/admin': '/admin',
}

function isTabActive(pathname: string, href: string): boolean {
  if (href === '/home') return pathname.startsWith('/home')
  if (href === '/vehicles' || href === '/dashboard') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/vehicles') || pathname === '/vehicles'
  }
  const previewHref = DASHBOARD_TO_PREVIEW[href] ?? href
  if (previewHref !== href) {
    return pathname.startsWith(href) || pathname === previewHref
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
      src={`/company-logos/${slug}${ext}`}
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
  const { navigateTo, showOverlay } = usePageTransitionContext()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null)
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false)
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const showCompanySwitcher =
    (pathname.startsWith('/dashboard') || pathname.startsWith('/home')) &&
    companies.length >= 2

  const [companySettings, setCompanySettings] = useState<CompanySetting | null>(null)
  const companyConfigRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdmin(user?.user_metadata?.is_admin === true)
      setUserEmail(user?.email ?? null)
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

  useEffect(() => {
    if (!currentCompanyId) {
      setCompanyConfig(null)
      companyConfigRef.current = null
      return
    }
    let cancelled = false
    fetch(`/api/company-config?company_id=${encodeURIComponent(currentCompanyId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        if (!cancelled && config) {
          companyConfigRef.current = config
          setCompanyConfig(config)
        }
      })
      .catch(() => {
        if (!cancelled) {
          companyConfigRef.current = null
          setCompanyConfig(null)
        }
      })
    return () => { cancelled = true }
  }, [currentCompanyId])

  const [navbarScrolled, setNavbarScrolled] = useState(false)
  const [companyConfig, setCompanyConfig] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const onScroll = () => setNavbarScrolled(typeof window !== 'undefined' && window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSwitchCompany = async (company: Company) => {
    if (company.id === currentCompanyId) {
      setCompanySwitcherOpen(false)
      return
    }
    const displayName = company.displayName ?? company.name
    showOverlay(`Switching to ${displayName}`)
    setCompanySwitcherOpen(false)
    try {
      await supabase.auth.updateUser({
        data: { company_id: company.id, company_name: displayName },
      })
      let roadmapOnly = company.roadmapOnly ?? (company.name || '').toLowerCase().includes('roadmap')
      try {
        const res = await fetch(`/api/company-config?company_id=${encodeURIComponent(company.id)}`)
        if (res.ok) {
          const config = await res.json()
          setCompanyConfig(config)
          if (config.roadmap_only !== undefined) roadmapOnly = !!config.roadmap_only
        }
      } catch (_) {
        // non-blocking
      }
      setTimeout(() => {
        window.location.href = roadmapOnly ? '/dashboard/roadmap' : '/home'
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
  const showRoadmapForCompany = /prush/i.test(currentCompanyName)
  const isJames = userEmail === 'james@wheelzup.com'

  const inspectionsEnabled = companySettings?.inspectionsEnabled !== false
  const template = companySettings?.template ?? 'default'
  const customTabs = template === 'custom' && companySettings?.customTemplate?.tabs?.length
    ? companySettings.customTemplate.tabs
    : null

  const TAB_ORDER = ['home', 'vehicles', 'drivers', 'inspections', 'about', 'roadmap', 'control_panel', 'admin'] as const
  const TAB_KEY_MAP: Record<string, { label: string; href: string }> = {
    home: { label: 'Home', href: '/home' },
    vehicles: { label: 'Vehicles', href: '/dashboard' },
    drivers: { label: 'Drivers', href: '/dashboard/drivers' },
    inspections: { label: 'Inspections', href: '/dashboard/inspections' },
    about: { label: 'About', href: '/dashboard/about' },
    roadmap: { label: 'Roadmap', href: '/dashboard/roadmap' },
    control_panel: { label: 'Control Panel', href: '/dashboard/control-panel' },
    admin: { label: 'Admin', href: '/dashboard/admin' },
  }

  const configEnabledTabs = (companyConfig?.enabled_tabs as string[] | undefined) ?? null
  const configCustomLabels = (companyConfig?.custom_tab_labels as Record<string, string> | undefined) ?? null
  const configInspections = companyConfig?.inspections_enabled as boolean | undefined
  const configRoadmap = companyConfig?.roadmap_only as boolean | undefined
  const inspectionsEnabledFromConfig = configInspections !== undefined ? configInspections : companySettings?.inspectionsEnabled !== false
  // Roadmap tab is only visible to James, even if enabled in config.
  const showRoadmapFromConfig = isJames && (configRoadmap !== undefined ? configRoadmap : showRoadmapForCompany)

  let navItems: { label: string; href: string }[]
  if (configEnabledTabs?.length) {
    const ordered = TAB_ORDER.filter((key) => configEnabledTabs.includes(key))
    navItems = ordered
      .filter((key) => {
        if (key === 'inspections' && !inspectionsEnabledFromConfig) return false
        if (key === 'roadmap' && !showRoadmapFromConfig) return false
        if (key === 'control_panel' && !currentCompanyId) return false
        if (key === 'admin' && !isAdmin) return false
        return true
      })
      .map((key) => {
        const item = TAB_KEY_MAP[key]
        if (!item) return null
        const label = configCustomLabels?.[key] ?? item.label
        return { label, href: item.href }
      })
      .filter(Boolean) as { label: string; href: string }[]
  } else if (customTabs?.length) {
    navItems = customTabs
      .map((key) => {
        const item = TAB_KEY_MAP[key]
        if (!item) return null
        const label = configCustomLabels?.[key] ?? item.label
        return { label, href: item.href }
      })
      .filter(Boolean) as { label: string; href: string }[]
    if (!navItems.some((i) => i.href === '/dashboard/settings')) {
      if (pathname.startsWith('/dashboard/settings')) {
        navItems.push({ label: 'Settings', href: '/dashboard/settings' })
      }
    }
  } else {
    navItems = [
      { label: configCustomLabels?.home ?? 'Home', href: '/home' },
      { label: configCustomLabels?.vehicles ?? 'Vehicles', href: '/dashboard' },
      { label: configCustomLabels?.drivers ?? 'Drivers', href: '/dashboard/drivers' },
      ...(inspectionsEnabledFromConfig ? [{ label: configCustomLabels?.inspections ?? 'Inspections', href: '/dashboard/inspections' }] : []),
      { label: configCustomLabels?.about ?? 'About', href: '/dashboard/about' },
      ...(showRoadmapFromConfig ? [{ label: configCustomLabels?.roadmap ?? 'Roadmap', href: '/dashboard/roadmap' }] : []),
      ...(currentCompanyId ? [{ label: configCustomLabels?.control_panel ?? 'Control Panel', href: '/dashboard/control-panel' }] : []),
    ]
    if (pathname.startsWith('/dashboard/settings')) {
      navItems.push({ label: 'Settings', href: '/dashboard/settings' })
    }
  }

  if (isAdmin && !navItems.some((i) => i.href === '/dashboard/admin')) {
    navItems.push({ label: configCustomLabels?.admin ?? 'Admin', href: '/dashboard/admin' })
  }

  // When on preview routes, show all tabs with preview URLs (admin-style view)
  const usePreviewHrefs = isPreviewPath(pathname)
  const previewNavItems: { label: string; href: string }[] = [
    { label: 'Vehicles', href: '/vehicles' },
    { label: 'Drivers', href: '/drivers' },
    { label: 'Inspections', href: '/inspections' },
    { label: 'About', href: '/about' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Control Panel', href: '/control-panel' },
    { label: 'Admin', href: '/admin' },
  ]
  const finalNavItems = usePreviewHrefs ? previewNavItems : navItems

  return (
    <NavbarView
      navItems={finalNavItems}
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
      scrolled={navbarScrolled}
      companyConfig={companyConfig}
    />
  )
}
