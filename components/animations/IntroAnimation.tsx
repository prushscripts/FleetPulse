'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { INTRO_VIDEO } from '@/lib/animation-paths'

const MAX_PLAY_MS = 3000
const TRANSITION_DURATION_MS = 600
const LOAD_TIMEOUT_MS = 1500

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
}

/**
 * Full-screen intro video — plays once per session (fp_intro_shown).
 * Graceful fallback: if video is missing (e.g. *.mp4 gitignored on Vercel), skip video and do CSS transition only.
 */
export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const doneRef = useRef(false)
  const [phase, setPhase] = useState<'playing' | 'transition' | 'done'>('playing')
  const [videoUnavailable, setVideoUnavailable] = useState(false)
  const [mobile] = useState(() => isMobile())

  useEffect(() => {
    if (mobile) {
      const t = setTimeout(() => { setPhase('done'); onComplete() }, 100)
      return () => clearTimeout(t)
    }

    const video = videoRef.current
    if (!video) return

    const goToTransition = () => {
      if (doneRef.current) return
      doneRef.current = true
      setVideoUnavailable(true)
      setPhase('transition')
      setTimeout(() => { setPhase('done'); onComplete() }, TRANSITION_DURATION_MS)
    }

    video.play().catch(goToTransition)

    const maxPlayTimer = setTimeout(goToTransition, MAX_PLAY_MS)
    const loadTimeout = setTimeout(() => {
      if (video.readyState < 2) goToTransition()
    }, LOAD_TIMEOUT_MS)

    const handleEnded = goToTransition
    const handleError = goToTransition

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    return () => {
      clearTimeout(maxPlayTimer)
      clearTimeout(loadTimeout)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [mobile, onComplete])

  const handleSkip = () => {
    setPhase('transition')
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, TRANSITION_DURATION_MS)
  }

  if (phase === 'done') return null
  if (mobile) return null

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0F1E]"
        animate={
          phase === 'transition'
            ? { opacity: 0, scale: 1.05 }
            : { opacity: 1, scale: 1 }
        }
        transition={
          phase === 'transition'
            ? { duration: TRANSITION_DURATION_MS / 1000, ease: 'easeOut' }
            : {}
        }
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {!videoUnavailable && (
            <video
              ref={videoRef}
              src={INTRO_VIDEO}
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              aria-label="FleetPulse intro"
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, #0A0F1E 100%)',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Skip intro"
        >
          <X size={20} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
