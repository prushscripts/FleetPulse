'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const TOTAL_DURATION_MS = 2400
const OVERLAY_EXIT_MS = 500

/**
 * Landing intro: rings → heartbeat flash → zoom fade exit. onComplete after exit settles.
 */
export default function IntroAnimation({
  onComplete,
}: {
  onComplete: () => void
}) {
  const [visible, setVisible] = useState(true)
  const [heartbeat, setHeartbeat] = useState(false)

  useEffect(() => {
    const tHeartbeat = window.setTimeout(() => setHeartbeat(true), TOTAL_DURATION_MS - 300)
    const tExit = window.setTimeout(() => setVisible(false), TOTAL_DURATION_MS)
    return () => {
      clearTimeout(tHeartbeat)
      clearTimeout(tExit)
    }
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
            initial={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 1.08,
              transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
            }}
            className="fixed inset-0 z-[100] bg-[#0A0F1E] overflow-hidden will-change-transform"
            style={{ transformOrigin: '50% 50%' }}
          >
            {heartbeat && (
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(59,130,246,0.35) 0%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.15, 1.4] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}

            {/* Full screen radial glow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
              }}
            />

            {/* 5 expanding rings — all perfectly centered */}
            {[
              { delay: 0, color: 'rgba(59,130,246,0.75)', width: 2 },
              { delay: 0.25, color: 'rgba(59,130,246,0.55)', width: 1.5 },
              { delay: 0.5, color: 'rgba(59,130,246,0.4)', width: 1 },
              { delay: 0.75, color: 'rgba(59,130,246,0.25)', width: 1 },
              { delay: 1.0, color: 'rgba(59,130,246,0.15)', width: 0.5 },
            ].map((ring, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  borderRadius: '50%',
                  border: `${ring.width}px solid ${ring.color}`,
                  translateX: '-50%',
                  translateY: '-50%',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 1600, height: 1600, opacity: 0 }}
                transition={{
                  duration: 2.2,
                  delay: ring.delay,
                  ease: [0.1, 0.4, 0.6, 1],
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            ))}

            {/* Glowing center dot — larger and brighter */}
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                translateX: '-50%',
                translateY: '-50%',
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                boxShadow:
                  '0 0 30px 10px rgba(59,130,246,0.7), 0 0 60px 20px rgba(59,130,246,0.3)',
              }}
              animate={{
                scale: [1, 1.6, 1],
                boxShadow: [
                  '0 0 30px 10px rgba(59,130,246,0.7), 0 0 60px 20px rgba(59,130,246,0.3)',
                  '0 0 50px 18px rgba(59,130,246,0.9), 0 0 100px 40px rgba(59,130,246,0.5)',
                  '0 0 30px 10px rgba(59,130,246,0.7), 0 0 60px 20px rgba(59,130,246,0.3)',
                ],
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Logo block — centered vertically, positioned slightly below center */}
            <motion.div
              style={{
                position: 'absolute',
                top: '54%',
                left: '50%',
                translateX: '-50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            >
              <Image
                src="/branding/fleetpulse-logo.png"
                alt="FleetPulse"
                width={280}
                height={66}
                style={{ opacity: 1 }}
                priority
              />
              <div style={{ width: 48, height: 2, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 1 }} />
              <p
                style={{
                  color: 'rgba(148,163,184,0.8)',
                  fontSize: 13,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  margin: 0,
                  fontFamily: 'Geist, sans-serif',
                  fontWeight: 500,
                }}
              >
                Fleet Management System
              </p>
            </motion.div>

            {/* Progress bar at bottom */}
            <div
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
                style={{
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  borderRadius: 1,
                  originX: 0,
                  transformOrigin: 'left center',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2.2, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
