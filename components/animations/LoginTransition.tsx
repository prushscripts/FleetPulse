'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  onComplete: () => void
}

const messages = ['Authenticating...', 'Loading your fleet...', 'Ready.']

export default function LoginTransition({ onComplete }: Props) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [showRipple, setShowRipple] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setMessageIndex(1), 800)
    const t2 = setTimeout(() => setMessageIndex(2), 1600)
    const t3 = setTimeout(() => setShowRipple(true), 2200)
    const t4 = setTimeout(() => {
      setExiting(true)
      setTimeout(onComplete, 600)
    }, 2800)

    return () => {
      ;[t1, t2, t3, t4].forEach(clearTimeout)
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: exiting ? 0 : 1,
        scale: exiting ? 1.08 : 1,
      }}
      transition={{ duration: exiting ? 0.6 : 0.2 }}
      className="fixed inset-0 z-[9999] bg-[#0A0F1E] flex flex-col items-center justify-center gap-8 overflow-hidden"
    >
      <AnimatePresence>
        {showRipple && (
          <>
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{
                  duration: 1.2,
                  delay,
                  ease: 'easeOut',
                }}
                className="absolute w-32 h-32 rounded-full border border-blue-500/60"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-blue-500 rounded-full scale-75" />
        <video
          src="/Animations/possibleLogoLoop.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px] object-contain"
          onError={() => {}}
          aria-hidden
        />
      </div>

      <div className="flex flex-col items-center gap-2 h-16">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`text-sm font-mono tracking-widest ${
              messageIndex === 2 ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
