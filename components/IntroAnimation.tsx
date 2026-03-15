'use client'

import { useState, useEffect, useRef } from 'react'

const INTRO_STORAGE_KEY = 'fleetpulse-intro-seen'
const VIDEO_PATH = '/animations/officialFPAnimation.mp4'
const VIDEO_PATH_FALLBACK = '/Animations/officialFPAnimation.mp4'
const PULSE_BURST_MS = 700
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
      {/* Page wrapper: blur zoom (scale 0.98 → 1, blur 8px → 0) and fade in when intro ends */}
      <div
        className="min-h-screen w-full"
        style={{
          transform: showIntro === true ? 'scale(0.98)' : 'scale(1)',
          filter: showIntro === true ? 'blur(8px)' : 'blur(0)',
          opacity: showIntro === true ? 0.95 : 1,
          transition: 'transform 500ms ease-out, filter 500ms ease-out, opacity 500ms ease-out',
        }}
      >
        {children}
      </div>
      {showIntro === true && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #0b1220 0%, #050914 70%)',
          }}
        >
          {/* Vignette edges — center feels illuminated */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            }}
          />
          {/* Subtle animated grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Soft purple glow behind video */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{
              opacity: phase === 'reveal' ? 0 : 1,
              transitionDuration: `${FADE_REVEAL_MS}ms`,
            }}
          >
            {/* Video container: max-w 520px, rounded-lg, shadow-xl, drop-shadow glow */}
            <div
              className="relative z-10 rounded-lg shadow-xl w-full max-w-[min(90vw,520px)] flex items-center justify-center"
              style={{
                filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.25))',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                preload="auto"
                src={videoSrc}
                className="w-full h-auto object-contain rounded-lg"
                style={{ background: 'transparent' }}
                onEnded={onVideoEnded}
                onError={() => {
                  if (videoSrc === VIDEO_PATH) setVideoSrc(VIDEO_PATH_FALLBACK)
                }}
                aria-label="FleetPulse intro"
              />
            </div>
          </div>

          {/* Purple pulse burst after video ends (scale 1 → 1.6, opacity 1 → 0, 700ms) */}
          {phase === 'pulse' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="rounded-full bg-purple-500/50 w-[140px] h-[140px] animate-intro-pulse-burst" />
            </div>
          )}
        </div>
      )}
    </>
  )
}
