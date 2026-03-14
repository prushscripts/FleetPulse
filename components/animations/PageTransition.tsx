'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

const FADE_IN_MS = 150
const MIN_VISIBLE_MS = 700
const FADE_OUT_MS = 250

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const router = useRouter()

  const navigateTo = useCallback((href: string) => {
    const label = HREF_LABEL_MAP[href] ?? (href.startsWith('/dashboard/vehicles') ? 'Vehicles' : 'Page')
    setLoadingLabel(label)
    setExiting(false)
    setIsTransitioning(true)
    router.push(href)
    setTimeout(() => {
      setExiting(true)
      setLoadingLabel('')
      setTimeout(() => {
        setIsTransitioning(false)
        setExiting(false)
      }, FADE_OUT_MS)
    }, FADE_IN_MS + MIN_VISIBLE_MS)
  }, [router])

  const showOverlay = useCallback((label: string) => {
    setLoadingLabel(label)
    setExiting(false)
    setIsTransitioning(true)
  }, [])

  const hideOverlay = useCallback(() => {
    setExiting(true)
    setLoadingLabel('')
    setTimeout(() => {
      setIsTransitioning(false)
      setExiting(false)
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
