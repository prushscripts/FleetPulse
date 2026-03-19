'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const TOTAL_DURATION_MS = 2400
const OVERLAY_EXIT_MS = 500

/**
 * Landing mission-control boot overlay. ~2.4s then curtain exit. No CSS ring classes.
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
            className="fixed inset-0 z-[100] bg-[#0A0F1E] overflow-hidden will-change-transform"
            style={{ transformOrigin: 'center top' }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0, 0.2, 0.4, 0.65, 0.9].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    border: `${i === 0 ? 1.5 : 1}px solid rgba(59,130,246,${Math.max(0.15, 0.7 - i * 0.12)})`,
                    width: 120,
                    height: 120,
                  }}
                  animate={{
                    width: ['120px', `${900 + i * 120}px`],
                    height: ['120px', `${900 + i * 120}px`],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    delay,
                    ease: [0.2, 0.8, 0.4, 1],
                    repeat: Infinity,
                    repeatDelay: 0.8,
                  }}
                />
              ))}
            </div>

            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#3B82F6',
                boxShadow: '0 0 20px 6px rgba(59,130,246,0.6)',
              }}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            <motion.div
              style={{
                position: 'absolute',
                bottom: '38%',
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Image
                src="/branding/fleetpulse-logo.png"
                alt="FleetPulse"
                width={180}
                height={40}
                style={{ opacity: 0.9 }}
                priority
              />
              <div
                style={{
                  width: 32,
                  height: 1.5,
                  backgroundColor: 'rgba(59,130,246,0.6)',
                  borderRadius: 1,
                }}
              />
              <p
                style={{
                  color: 'rgba(148,163,184,0.7)',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
                }}
              >
                Fleet Management System
              </p>
            </motion.div>

            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <motion.div
                style={{ height: '100%', backgroundColor: '#3B82F6', borderRadius: 1 }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.0, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
