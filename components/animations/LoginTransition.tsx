'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LOGO_LOOP_VIDEO, LOGO_LOOP_FALLBACK } from '@/lib/animation-paths'

const VIDEO_HOLD_MS = 1500
const BLUR_DURATION_MS = 500

/**
 * Post-login overlay: logo loop video for 1.5s, then blur-to-clear transition (0.5s), then onComplete (redirect).
 */
export default function LoginTransition({
  onComplete,
}: {
  onComplete: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'video' | 'blur-out' | 'done'>('video')
  const [videoSrc, setVideoSrc] = useState(LOGO_LOOP_VIDEO)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video && !videoFailed) {
      video.play().catch(() => setVideoFailed(true))
    }
  }, [videoFailed])

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('blur-out')
      const t2 = setTimeout(() => {
        setPhase('done')
        onComplete()
      }, BLUR_DURATION_MS)
      return () => clearTimeout(t2)
    }, VIDEO_HOLD_MS)
    return () => clearTimeout(t)
  }, [onComplete])

  const handleSkip = () => {
    setPhase('blur-out')
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, BLUR_DURATION_MS)
  }

  const handleVideoError = () => {
    if (videoSrc === LOGO_LOOP_VIDEO) {
      setVideoSrc(LOGO_LOOP_FALLBACK)
    } else {
      setVideoFailed(true)
    }
  }

  if (phase === 'done') return null

  return (
    <AnimatePresence>
      <motion.div
        key="login-transition"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0F1E]"
        initial={{ filter: 'blur(0px)', opacity: 1 }}
        animate={
          phase === 'blur-out'
            ? { filter: 'blur(0px)', opacity: 0 }
            : { filter: 'blur(0px)', opacity: 1 }
        }
        transition={
          phase === 'blur-out'
            ? {
                duration: BLUR_DURATION_MS / 1000,
                ease: 'easeOut',
              }
            : {}
        }
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ filter: 'blur(0px)', opacity: 1 }}
          animate={
            phase === 'blur-out'
              ? { filter: 'blur(20px)', opacity: 0 }
              : { filter: 'blur(0px)', opacity: 1 }
          }
          transition={
            phase === 'blur-out'
              ? { duration: BLUR_DURATION_MS / 1000, ease: 'easeOut' }
              : {}
          }
        >
          {!videoFailed ? (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              playsInline
              loop
              preload="auto"
              className="max-w-[200px] w-full h-auto object-contain"
              onError={handleVideoError}
              aria-hidden
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <span className="text-2xl text-blue-400">✓</span>
            </div>
          )}
        </motion.div>

        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Skip"
        >
          <X size={20} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
