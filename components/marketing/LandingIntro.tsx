'use client'

import { useState, useEffect, useRef } from 'react'

const INTRO_STORAGE_KEY = 'fleetpulse-intro-seen'
const VIDEO_PATH = '/animations/officialFPAnimation.mp4'
const VIDEO_PATH_FALLBACK = '/Animations/officialFPAnimation.mp4'
const MIN_DISPLAY_MS = 2500
const TRANSITION_MS = 1200

export default function LandingIntro() {
  const [visible, setVisible] = useState<boolean | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [videoSrc, setVideoSrc] = useState(VIDEO_PATH)
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
        background: 'linear-gradient(180deg, #050810 0%, #0a0e1a 40%, #080c14 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center transition-all ease-out"
        style={{
          transitionDuration: `${TRANSITION_MS}ms`,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(1.05)' : 'scale(1)',
          filter: transitioning ? 'blur(10px)' : 'blur(0)',
        }}
      >
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            transitionDuration: `${TRANSITION_MS}ms`,
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139, 92, 246, 0.18) 0%, transparent 60%)',
            opacity: transitioning ? 0 : 1,
          }}
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          src={videoSrc}
          className="relative z-10 w-full max-w-[min(90vw,560px)] h-auto object-contain"
          style={{ background: 'transparent' }}
          onEnded={handleVideoEnded}
          onError={() => {
            if (videoSrc === VIDEO_PATH) setVideoSrc(VIDEO_PATH_FALLBACK)
          }}
          aria-label="FleetPulse intro"
        />
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
