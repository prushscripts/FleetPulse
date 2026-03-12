'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const router = useRouter()

  const navigateTo = (href: string) => {
    setIsTransitioning(true)
    setOpacity(1)
    router.push(href)
    setTimeout(() => {
      setOpacity(0)
      setTimeout(() => setIsTransitioning(false), 300)
    }, 400)
  }

  return { isTransitioning, opacity, navigateTo }
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
  background: 'rgba(8,10,20,0.97)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.3s ease-out',
  pointerEvents: 'none',
}

function TransitionOverlay({ isTransitioning, opacity }: { isTransitioning: boolean; opacity: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!isTransitioning) return null

  return (
    <div style={{ ...overlayStyle, opacity }}>
      <video
        ref={videoRef}
        src="/assets/possibleLogoLoop.mp4"
        autoPlay
        muted
        playsInline
        style={{
          width: '480px',
          height: 'auto',
          mixBlendMode: 'screen',
        }}
        aria-hidden
      />
    </div>
  )
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const { isTransitioning, opacity, navigateTo } = usePageTransition()
  return (
    <PageTransitionContext.Provider value={{ navigateTo }}>
      {children}
      <TransitionOverlay isTransitioning={isTransitioning} opacity={opacity} />
    </PageTransitionContext.Provider>
  )
}
