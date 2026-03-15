'use client'

import { useState, useEffect, useRef } from 'react'

const INTRO_STORAGE_KEY = 'fleetpulse-intro-seen'
const VIDEO_PATH = '/animations/officialFPAnimation.mp4'
const VIDEO_PATH_FALLBACK = '/Animations/officialFPAnimation.mp4'
const PULSE_BURST_MS = 800
const FADE_REVEAL_MS = 500

export default function IntroAnimation({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<'video' | 'pulse' | 'reveal'>('video')
  const [videoSrc, setVideoSrc] = useState(VIDEO_PATH)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(INTRO_STORAGE_KEY)
    setShowIntro(seen !== '1')
  }, [])

  const onVideoEnded = () => {
    setPhase('pulse')
    setTimeout(() => {
      setPhase('reveal')
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
      setTimeout(() => setShowIntro(false), FADE_REVEAL_MS)
    }, PULSE_BURST_MS)
  }

  return (
    <>
      {children}
      {showIntro === true && (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #050810 0%, #0a0e1a 40%, #080c14 100%)',
      }}
    >
      {/* Dark gradient background */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
        style={{
          opacity: phase === 'reveal' ? 0 : 1,
          transitionDuration: `${FADE_REVEAL_MS}ms`,
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
          }}
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          src={videoSrc}
          className="relative z-10 w-full max-w-[min(90vw,520px)] h-auto object-contain"
          style={{ background: 'transparent' }}
          onEnded={onVideoEnded}
          onError={() => {
            if (videoSrc === VIDEO_PATH) setVideoSrc(VIDEO_PATH_FALLBACK)
          }}
          aria-label="FleetPulse intro"
        />
      </div>

      {/* Purple pulse burst after video ends */}
      {phase === 'pulse' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="rounded-full bg-purple-500/40 w-[120px] h-[120px] animate-intro-pulse-burst"
          />
        </div>
      )}
    </div>
      )}
    </>
  )
}
