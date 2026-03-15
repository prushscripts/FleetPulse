'use client'

import { useState, useEffect, useRef } from 'react'

const INTRO_STORAGE_KEY = 'fleetpulse-intro-seen'
const VIDEO_PATH = '/animations/officialFPAnimation.mp4'
const MIN_DISPLAY_MS = 2500
const TRANSITION_MS = 800

export default function LandingIntro() {
  const [visible, setVisible] = useState<boolean | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(INTRO_STORAGE_KEY)
    setVisible(seen !== '1')
  }, [])

  const handleVideoEnded = () => {
    const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : MIN_DISPLAY_MS
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
    setTimeout(() => startTransition(), remaining)
  }

  const startTransition = () => {
    setTransitioning(true)
    setTimeout(() => {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
      setVisible(false)
    }, TRANSITION_MS)
  }

  useEffect(() => {
    if (visible !== true) return
    startTimeRef.current = Date.now()
    const fallback = setTimeout(() => startTransition(), 3500)
    return () => clearTimeout(fallback)
  }, [visible])

  if (visible === null || visible === false) return null

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #060810 0%, #0a0e18 50%, #080c14 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-[800ms] ease-out"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <div
          className="absolute inset-0 transition-opacity duration-[800ms]"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
            opacity: transitioning ? 0 : 1,
          }}
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          className="relative z-10 w-full max-w-[min(90vw,560px)] h-auto object-contain"
          style={{ background: 'transparent' }}
          onEnded={handleVideoEnded}
          aria-label="FleetPulse intro"
        >
          <source src={VIDEO_PATH} type="video/mp4" />
        </video>
      </div>
      {transitioning && (
        <div
          className="absolute inset-0 pointer-events-none landing-intro-pulse"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.25) 0%, transparent 65%)',
          }}
        />
      )}
    </div>
  )
}
