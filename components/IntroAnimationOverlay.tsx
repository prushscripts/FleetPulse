'use client'

import { useState, useEffect, useRef } from 'react'

const VIDEO_PATH = '/animations/officialFPAnimation.mp4'
const VIDEO_PATH_FALLBACK = '/Animations/officialFPAnimation.mp4'
const PULSE_BURST_MS = 700
const FADE_REVEAL_MS = 500
const FAILSAFE_MS = 8000
const TRIGGER_PULSE_BEFORE_END_SEC = 2

type Props = { onEnd: () => void }

export default function IntroAnimationOverlay({ onEnd }: Props) {
  const [phase, setPhase] = useState<'video' | 'pulse' | 'reveal'>('video')
  const [videoSrc, setVideoSrc] = useState(VIDEO_PATH)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (typeof console !== 'undefined') console.log('[FleetPulse] intro animation mounted')
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof console !== 'undefined') console.log('[FleetPulse] intro failsafe: timeout')
      sessionStorage.setItem('fleetpulse-intro-seen', '1')
      onEnd()
    }, FAILSAFE_MS)
    return () => clearTimeout(t)
  }, [onEnd])

  const startPulseAndReveal = () => {
    if (triggeredRef.current) return
    triggeredRef.current = true
    setPhase('pulse')
    setTimeout(() => {
      setPhase('reveal')
      sessionStorage.setItem('fleetpulse-intro-seen', '1')
      setTimeout(onEnd, FADE_REVEAL_MS)
    }, PULSE_BURST_MS)
  }

  const handleVideoEnded = () => {
    startPulseAndReveal()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTimeUpdate = () => {
      if (triggeredRef.current) return
      const duration = video.duration
      if (!Number.isFinite(duration)) return
      if (video.currentTime >= Math.max(0, duration - TRIGGER_PULSE_BEFORE_END_SEC)) {
        startPulseAndReveal()
      }
    }
    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center min-h-[100svh] min-h-[100dvh] w-full"
      style={{
        background: videoReady ? 'radial-gradient(circle at center, #0b1220 0%, #050914 70%)' : 'radial-gradient(circle at center, #0b1220 0%, #050914 85%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="fixed inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)' }} />

      <div
        className="relative z-10 flex items-center justify-center w-full flex-1 min-h-0 transition-opacity duration-300"
        style={{ opacity: phase === 'reveal' ? 0 : 1, transitionDuration: `${FADE_REVEAL_MS}ms` }}
      >
        <div className="w-full max-w-[90vw] md:max-w-[520px] rounded-xl shadow-xl flex items-center justify-center bg-black/20" style={{ filter: 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.25))' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            src={videoSrc}
            className="w-full h-auto object-contain rounded-xl aspect-video"
            style={{ background: 'transparent' }}
            onEnded={handleVideoEnded}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => { if (videoSrc === VIDEO_PATH) setVideoSrc(VIDEO_PATH_FALLBACK) }}
            aria-label="FleetPulse intro"
          />
        </div>
      </div>

      {phase === 'pulse' && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="rounded-full bg-purple-500/50 w-[140px] h-[140px] animate-intro-pulse-burst" />
        </div>
      )}
    </div>
  )
}
