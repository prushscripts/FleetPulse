'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function IntroAnimation({
  onComplete,
}: {
  onComplete: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [done, setDone] = useState(false)

  const finish = () => {
    if (done) return
    setDone(true)
    sessionStorage.setItem('fp_intro_shown', 'true')
    setTimeout(onComplete, 800)
  }

  useEffect(() => {
    const fallback = setTimeout(finish, 5000)

    const video = videoRef.current
    if (video) {
      video.addEventListener('ended', finish)
      video.addEventListener('error', finish)
      const maxDuration = setTimeout(finish, 4000)
      return () => {
        clearTimeout(fallback)
        clearTimeout(maxDuration)
        video.removeEventListener('ended', finish)
        video.removeEventListener('error', finish)
      }
    }
    return () => clearTimeout(fallback)
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] bg-[#0A0F1E] flex items-center justify-center overflow-hidden"
        >
          <video
            ref={videoRef}
            src="/Animations/officialFPAnimation.mp4"
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            onCanPlay={() => {}}
            onError={finish}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <Image
              src="/branding/fleetpulse-logo.png"
              alt="FleetPulse"
              width={220}
              height={50}
              className="w-48 md:w-56 h-auto"
              priority
            />
          </motion.div>

          <button
            type="button"
            onClick={finish}
            className="absolute top-6 right-6 z-20 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
