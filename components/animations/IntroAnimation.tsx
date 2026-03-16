'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { INTRO_VIDEO, INTRO_VIDEO_FALLBACK } from '@/lib/animation-paths'

const MAX_PLAY_MS = 3000
const TRANSITION_DURATION_MS = 600
const LOAD_TIMEOUT_MS = 2000

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
}

/**
 * Full-screen intro video — plays once per session (fp_intro_shown).
 * When video ends or after 3s max: transition out. On mobile: skip video, just fade in.
 */
export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'playing' | 'transition' | 'done'>('playing')
  const [videoSrc, setVideoSrc] = useState(INTRO_VIDEO)
  const [mobile] = useState(() => isMobile())

  useEffect(() => {
    if (mobile) {
      // On mobile skip video, just complete after a brief moment
      const t = setTimeout(() => {
        setPhase('done')
        onComplete()
      }, 100)
      return () => clearTimeout(t)
    }

    const video = videoRef.current
    if (!video) return

    video.play().catch(() => {
      setPhase('done')
      onComplete()
    })

    const maxPlayTimer = setTimeout(() => {
      setPhase('transition')
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, TRANSITION_DURATION_MS)
    }, MAX_PLAY_MS)

    const loadTimeout = setTimeout(() => {
      if (video.readyState < 2) {
        setPhase('done')
        onComplete()
      }
    }, LOAD_TIMEOUT_MS)

    const handleEnded = () => {
      setPhase('transition')
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, TRANSITION_DURATION_MS)
    }

    const handleError = () => {
      if (videoSrc === INTRO_VIDEO) {
        setVideoSrc(INTRO_VIDEO_FALLBACK)
      } else {
        setPhase('done')
        onComplete()
      }
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    return () => {
      clearTimeout(maxPlayTimer)
      clearTimeout(loadTimeout)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [mobile, onComplete, videoSrc])

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
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            aria-label="FleetPulse intro"
          />
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
