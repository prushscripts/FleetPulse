'use client'

import { useState, useEffect } from 'react'
import IntroAnimationOverlay from './IntroAnimationOverlay'

const INTRO_STORAGE_KEY = 'fleetpulse-intro-seen'

/**
 * Renders children always. Intro is an overlay only — never blocks or replaces UI.
 */
export default function IntroAnimation({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof console !== 'undefined') console.log('[FleetPulse] layout loaded')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(INTRO_STORAGE_KEY)
    setShowIntro(seen !== '1')
  }, [])

  return (
    <>
      {children}
      {showIntro === true && (
        <IntroAnimationOverlay
          onEnd={() => {
            setShowIntro(false)
          }}
        />
      )}
    </>
  )
}
