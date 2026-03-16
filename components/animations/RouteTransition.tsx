'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LOGO_LOOP_VIDEO } from '@/lib/animation-paths'

/**
 * Branded route transition — shows logo loop video briefly during navigation.
 * Uses mix-blend-mode: screen so dark video background blends into navy.
 */
export default function RouteTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPathRef = useRef(pathname)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (pathname === prevPathRef.current) return

    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
      prevPathRef.current = pathname
    }, 700)
    return () => clearTimeout(timer)
  }, [pathname])

  // Play video after it mounts (it's conditional so ref is set on next paint)
  useEffect(() => {
    if (!isTransitioning) return
    const t = requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {})
    })
    return () => cancelAnimationFrame(t)
  }, [isTransitioning])

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="route-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(10, 15, 30, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-32 h-32 flex items-center justify-center"
          >
            <video
              ref={videoRef}
              src={LOGO_LOOP_VIDEO}
              muted
              playsInline
              loop
              preload="auto"
              className="w-full h-full object-contain"
              style={{ mixBlendMode: 'screen' }}
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.6), transparent)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
