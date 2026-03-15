'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'

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
const MIN_VISIBLE_MS = 400
const FADE_OUT_MS = 300

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const router = useRouter()

  const navigateTo = (href: string) => {
    const label = HREF_LABEL_MAP[href] ?? 'Page'
    setLoadingLabel(label)
    setExiting(false)
    setIsTransitioning(true)
    setOpacity(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpacity(1))
    })
    router.push(href)
    setTimeout(() => {
      setExiting(true)
      setOpacity(0)
      setTimeout(() => {
        setIsTransitioning(false)
        setExiting(false)
      }, FADE_OUT_MS)
    }, FADE_IN_MS + MIN_VISIBLE_MS)
  }

  return { isTransitioning, opacity, exiting, loadingLabel, navigateTo }
}

const PageTransitionContext = createContext<{ navigateTo: (href: string) => void } | null>(null)

export function usePageTransitionContext() {
  const ctx = useContext(PageTransitionContext)
  if (!ctx) return { navigateTo: (href: string) => { window.location.href = href } }
  return ctx
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: '#080a14',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  transition: `opacity ${FADE_IN_MS}ms ease-out`,
}

function TransitionOverlay({
  isTransitioning,
  opacity,
  exiting,
  loadingLabel,
}: {
  isTransitioning: boolean
  opacity: number
  exiting: boolean
  loadingLabel: string
}) {
  if (!isTransitioning) return null

  return (
    <div
      style={{
        ...overlayStyle,
        opacity,
        transition: exiting ? `opacity ${FADE_OUT_MS}ms ease-out, transform ${FADE_OUT_MS}ms ease-out` : `opacity ${FADE_IN_MS}ms ease-out`,
        transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      <p
        className="text-sm font-light uppercase mb-6 text-purple-300/70"
        style={{ letterSpacing: '0.3em' }}
      >
        Loading {loadingLabel}...
      </p>
      <video
        autoPlay
        muted
        playsInline
        style={{
          width: '320px',
          height: 'auto',
          mixBlendMode: 'screen',
          background: 'transparent',
          display: 'block',
        }}
        aria-hidden
      >
        <source src="/assets/fleetpulse_logo_loop.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const { isTransitioning, opacity, exiting, loadingLabel, navigateTo } = usePageTransition()
  return (
    <PageTransitionContext.Provider value={{ navigateTo }}>
      {children}
      <TransitionOverlay
        isTransitioning={isTransitioning}
        opacity={opacity}
        exiting={exiting}
        loadingLabel={loadingLabel}
      />
    </PageTransitionContext.Provider>
  )
}
