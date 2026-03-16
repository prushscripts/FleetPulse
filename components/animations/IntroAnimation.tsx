'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INTRO_VIDEO } from '@/lib/animation-paths'

const BLUR_OUT_DURATION_MS = 1200
const LOAD_TIMEOUT_MS = 2000 // Skip intro on slow connections (e.g. mobile)

/**
 * Full-screen intro video — plays once, then blur/scale transition into the page.
 * Uses mix-blend-mode: screen so dark video background blends into navy (#0A0F1E).
 * Chosen: 'screen' — makes blacks transparent, keeps bright elements visible.
 */
export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'playing' | 'blur-out' | 'done'>('playing')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.play().catch(() => {
      // Autoplay blocked — skip intro immediately
      setPhase('done')
      onComplete()
    })

    // On slow connections, skip after 2s if video hasn't loaded
    const loadTimeout = setTimeout(() => {
      if (video.readyState < 3) {
        setPhase('done')
        onComplete()
      }
    }, LOAD_TIMEOUT_MS)

    const handleEnded = () => {
      setPhase('blur-out')
      setTimeout(() => {
        setPhase('done')
        onComplete()
      }, BLUR_OUT_DURATION_MS)
    }

    video.addEventListener('ended', handleEnded)
    return () => {
      clearTimeout(loadTimeout)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onComplete])

  const handleSkip = () => {
    setPhase('blur-out')
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, BLUR_OUT_DURATION_MS)
  }

  if (phase === 'done') return null

  return (
    <AnimatePresence>
      <motion.div
          key="intro"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0F1E]"
          animate={
            phase === 'blur-out'
              ? {
                  filter: ['blur(0px)', 'blur(0px)', 'blur(24px)', 'blur(60px)'],
                  scale: [1, 1, 1.04, 1.12],
                  opacity: [1, 1, 0.6, 0],
                }
              : { filter: 'blur(0px)', scale: 1, opacity: 1 }
          }
          transition={
            phase === 'blur-out'
              ? {
                  duration: 1.1,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.2, 0.7, 1],
                }
              : {}
          }
        >
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={INTRO_VIDEO}
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'screen' }}
              aria-label="FleetPulse intro"
            />

            {/* Dark overlay to deepen blacks and match site bg */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, #0A0F1E 100%)',
              }}
            />

            {/* Vignette — softens all edges */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 120px 60px #0A0F1E',
              }}
            />
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={handleSkip}
            className="absolute bottom-8 right-8 text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02] hover:bg-white/[0.04] min-h-[44px]"
            type="button"
          >
            Skip intro
            <span className="text-[10px] opacity-50">↵</span>
          </motion.button>
        </motion.div>
    </AnimatePresence>
  )
}

