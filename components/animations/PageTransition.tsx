'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import LoadingOverlay from './LoadingOverlay'

const HREF_LABEL_MAP: Record<string, string> = {
  '/home': 'Home',
  '/dashboard': 'Dashboard',
  '/dashboard/vehicles': 'Vehicles',
  '/dashboard/drivers': 'Drivers',
  '/dashboard/inspections': 'Inspections',
  '/dashboard/about': 'About',
  '/dashboard/roadmap': 'Roadmap',
  '/dashboard/control-panel': 'Control Panel',
  '/dashboard/settings': 'Settings',
  '/dashboard/admin': 'Admin',
}

const DELAY_SHOW_MS = 120
const MIN_DISPLAY_MS = 800
const FADE_OUT_MS = 350

function normalizePath(href: string): string {
  const path = href.split('?')[0]
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
}

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [targetHref, setTargetHref] = useState<string | null>(null)
  const showTimeRef = useRef<number>(0)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minDisplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!targetHref) return
    const current = normalizePath(pathname)
    const target = normalizePath(targetHref)
    const isMatch = current === target || (target !== '/dashboard' && current.startsWith(target + '/'))
    if (!isMatch) return
    if (!isTransitioning) {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
      setTargetHref(null)
      return
    }
    const elapsed = Date.now() - showTimeRef.current
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
    minDisplayTimerRef.current = setTimeout(() => {
      setExiting(true)
      setLoadingLabel('')
      setTimeout(() => {
        setIsTransitioning(false)
        setExiting(false)
        setTargetHref(null)
      }, FADE_OUT_MS)
    }, remaining)
    return () => {
      if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current)
    }
  }, [pathname, targetHref, isTransitioning])

  const navigateTo = useCallback((href: string) => {
    const label = HREF_LABEL_MAP[href] ?? (href.startsWith('/dashboard/vehicles') ? 'Vehicles' : 'Page')
    setLoadingLabel(label)
    setExiting(false)
    setTargetHref(href)
    router.push(href)
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null
      showTimeRef.current = Date.now()
      setIsTransitioning(true)
    }, DELAY_SHOW_MS)
  }, [router])

  const showOverlay = useCallback((label: string) => {
    setLoadingLabel(label)
    setExiting(false)
    setTargetHref(null)
    showTimeRef.current = Date.now()
    setIsTransitioning(true)
  }, [])

  const hideOverlay = useCallback(() => {
    setExiting(true)
    setLoadingLabel('')
    setTimeout(() => {
      setIsTransitioning(false)
      setExiting(false)
      setTargetHref(null)
    }, FADE_OUT_MS)
  }, [])

  return { isTransitioning, exiting, loadingLabel, navigateTo, showOverlay, hideOverlay }
}

type PageTransitionContextValue = {
  navigateTo: (href: string) => void
  showOverlay: (label: string) => void
  hideOverlay: () => void
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null)

export function usePageTransitionContext() {
  const ctx = useContext(PageTransitionContext)
  if (!ctx) {
    return {
      navigateTo: (href: string) => { window.location.href = href },
      showOverlay: () => {},
      hideOverlay: () => {},
    }
  }
  return ctx
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const { isTransitioning, exiting, loadingLabel, navigateTo, showOverlay, hideOverlay } = usePageTransition()
  return (
    <PageTransitionContext.Provider value={{ navigateTo, showOverlay, hideOverlay }}>
      {children}
      {isTransitioning && (
        <LoadingOverlay loadingLabel={loadingLabel} isExiting={exiting} />
      )}
    </PageTransitionContext.Provider>
  )
}
