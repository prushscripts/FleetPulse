'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const TOTAL_DURATION_MS = 2200
const OVERLAY_EXIT_MS = 500
const LOGO_SCALE_OUT_START_MS = 1400

/**
 * Premium CSS + Framer Motion intro. Plays every time the landing page loads.
 * No video, no sessionStorage. ~2.2s: large pulse rings → logo pop-in → scale/fade → curtain up.
 */
export default function IntroAnimation({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), TOTAL_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(onComplete, OVERLAY_EXIT_MS)
      return () => clearTimeout(t)
    }
  }, [visible, onComplete])

  return (
    <>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key="landing-intro-overlay"
            initial={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: '-100%',
              transition: { duration: OVERLAY_EXIT_MS / 1000, ease: [0.76, 0, 0.24, 1] },
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0F1E] overflow-hidden will-change-transform"
            style={{ transformOrigin: 'center top' }}
          >
            {/* Blue radial glow behind logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="intro-radial-glow absolute w-96 h-96 rounded-full blur-3xl" />
            </div>

            {/* Pulse rings — CSS in globals.css */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="intro-pulse-ring intro-pulse-ring-1" />
              <div className="intro-pulse-ring intro-pulse-ring-2" />
              <div className="intro-pulse-ring intro-pulse-ring-3" />
              <div className="intro-pulse-ring intro-pulse-ring-4" />
            </div>

            {/* Logo: scale 0.85→1 + fade in, then scale up / fade out before curtain */}
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: [1, 1.12],
                  opacity: [1, 0],
                }}
                transition={{
                  delay: LOGO_SCALE_OUT_START_MS / 1000,
                  duration: 0.4,
                  ease: [0.32, 0.72, 0, 1],
                }}
                style={{ transformOrigin: 'center' }}
              >
                <Image
                  src="/branding/fleetpulse-logo.png"
                  alt="FleetPulse"
                  width={220}
                  height={50}
                  className="w-48 md:w-56 h-auto"
                  priority
                  unoptimized={false}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
