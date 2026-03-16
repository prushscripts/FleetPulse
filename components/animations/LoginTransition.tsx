'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  onComplete: () => void
  /** When true, call onComplete when ready and do not run exit animation — overlay stays until redirect. */
  redirectOnComplete?: boolean
}

export default function LoginTransition({ onComplete, redirectOnComplete }: Props) {
  const [phase, setPhase] = useState<'enter' | 'scanning' | 'ready' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('scanning'), 600)
    const t2 = setTimeout(() => setPhase('ready'), 1800)
    if (redirectOnComplete) {
      const t3 = setTimeout(onComplete, 2600)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
    const t3 = setTimeout(() => setPhase('exit'), 2600)
    const t4 = setTimeout(onComplete, 3200)
    return () => {
      ;[t1, t2, t3, t4].forEach(clearTimeout)
    }
  }, [onComplete, redirectOnComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#050A14] flex flex-col items-center justify-center overflow-hidden"
      animate={phase === 'exit' ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Expanding rings */}
      {phase !== 'enter' &&
        [0, 0.3, 0.6].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-blue-500/20"
            initial={{ width: 80, height: 80, opacity: 0.8 }}
            animate={{
              width: 800,
              height: 800,
              opacity: 0,
            }}
            transition={{
              duration: 2.5,
              delay,
              ease: 'easeOut',
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        ))}

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-8 z-10">
        {/* Logo mark with pulse ring */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute w-24 h-24 rounded-full border border-blue-500/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center"
            animate={
              phase === 'ready'
                ? { borderColor: 'rgba(16,185,129,0.5)', backgroundColor: 'rgba(16,185,129,0.1)' }
                : {}
            }
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-blue-400"
              animate={
                phase === 'ready' ? { backgroundColor: '#10B981' } : { scale: [1, 1.3, 1] }
              }
              transition={{
                duration: phase === 'ready' ? 0.3 : 1,
                repeat: phase === 'ready' ? 0 : Infinity,
              }}
            />
          </motion.div>
        </div>

        {/* FleetPulse wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            FleetPulse
          </span>
          <span className="text-xs text-slate-600 font-mono tracking-widest uppercase">
            Fleet Management System
          </span>
        </motion.div>

        {/* Status messages */}
        <div className="flex flex-col items-center gap-3 h-12">
          <AnimatePresence mode="wait">
            {phase === 'enter' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-500 tracking-widest">
                  AUTHENTICATING
                </span>
              </motion.div>
            )}
            {phase === 'scanning' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-500 tracking-widest">
                  LOADING SYSTEM
                </span>
              </motion.div>
            )}
            {phase === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 tracking-widest">READY</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-48 h-[1px] bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{
                width:
                  phase === 'enter' ? '30%' : phase === 'scanning' ? '75%' : '100%',
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      {[
        'top-4 left-4 border-t border-l',
        'top-4 right-4 border-t border-r',
        'bottom-4 left-4 border-b border-l',
        'bottom-4 right-4 border-b border-r',
      ].map((pos) => (
        <div key={pos} className={`absolute w-8 h-8 border-blue-500/20 ${pos}`} />
      ))}

      {/* Bottom version text */}
      <div className="absolute bottom-6 text-[10px] font-mono text-slate-700 tracking-widest">
        FLEETPULSE v2.0 · SECURE CONNECTION
      </div>
    </motion.div>
  )
}
