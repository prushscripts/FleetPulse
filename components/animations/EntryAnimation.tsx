'use client'

import { useState, useEffect, useRef } from 'react'
import { LOGO_LOOP_VIDEO } from '@/lib/animation-paths'

const STAGE1_MS = 500
const STAGE2_MIN_MS = 2000
const PULSE_MS = 600
const FADEOUT_MS = 400

export default function EntryAnimation({ onComplete }: { onComplete?: () => void }) {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1)
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const onCompleteRef = useRef(onComplete)
  const stage2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  onCompleteRef.current = onComplete

  // Stage 1: black screen 0–0.5s
  useEffect(() => {
    const t = setTimeout(() => setStage(2), STAGE1_MS)
    return () => clearTimeout(t)
  }, [])

  // Stage 2: video + typewriter; trigger stage 3 on video end or after 2s
  const handleVideoEnded = () => {
    if (stage2TimerRef.current) {
      clearTimeout(stage2TimerRef.current)
      stage2TimerRef.current = null
    }
    setStage(3)
  }
  useEffect(() => {
    if (stage !== 2) return
    stage2TimerRef.current = setTimeout(() => setStage(3), STAGE2_MIN_MS)
    return () => {
      if (stage2TimerRef.current) clearTimeout(stage2TimerRef.current)
    }
  }, [stage])

  // Stage 3: pulse runs 600ms then stage 4
  useEffect(() => {
    if (stage !== 3) return
    pulseTimerRef.current = setTimeout(() => setStage(4), PULSE_MS)
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [stage])

  // Stage 4: call onComplete at start, fade overlay 400ms
  useEffect(() => {
    if (stage !== 4) return
    onCompleteRef.current?.()
    setOverlayOpacity(0)
  }, [stage])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080a14',
        opacity: overlayOpacity,
        transition: stage === 4 ? `opacity ${FADEOUT_MS}ms ease-out` : 'none',
      }}
    >
      {/* Stage 1: nothing (just black) */}

      {/* Stage 2: video + "ENTERING SYSTEM" typewriter + dots */}
      {stage >= 2 && stage < 3 && (
        <div className="flex flex-col items-center justify-center">
          <div
            className="flex items-center justify-center mb-6"
            style={{
              width: 'min(600px, 80vw)',
            }}
          >
            <video
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-label="FleetPulse"
              onCanPlay={(e) => e.currentTarget.play()}
              onEnded={handleVideoEnded}
              style={{
                width: '100%',
                mixBlendMode: 'screen',
                background: 'transparent',
                display: 'block',
              }}
            >
              <source src={LOGO_LOOP_VIDEO} type="video/mp4" />
            </video>
          </div>
          <p
            className="text-xs font-mono tracking-[0.4em] text-purple-400/80 flex items-center justify-center gap-0.5"
            style={{ letterSpacing: '0.4em' }}
          >
            <span className="animate-entry-typewriter">ENTERING SYSTEM</span>
            <span className="inline-flex gap-0.5 ml-1" aria-hidden>
              <span className="entry-ellipsis-dot w-1 h-1 rounded-full bg-current inline-block" />
              <span className="entry-ellipsis-dot entry-ellipsis-dot-2 w-1 h-1 rounded-full bg-current inline-block" />
              <span className="entry-ellipsis-dot entry-ellipsis-dot-3 w-1 h-1 rounded-full bg-current inline-block" />
            </span>
          </p>
        </div>
      )}

      {/* Stage 3: pulse burst (single white/purple radial burst) */}
      {stage === 3 && <div className="animate-entry-pulse-burst" aria-hidden />}
    </div>
  )
}
