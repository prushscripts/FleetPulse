'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, Map } from 'lucide-react'

function AnimatedCounter({ end, label }: { end: number; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1200
    const step = (end / duration) * 16
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end])

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-display font-bold text-white tabular-nums">
        {count}+
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

function VehicleDot({ x, y, status, delay }: { x: number; y: number; status: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{
        left: x + '%',
        top: y + '%',
        backgroundColor: status === 'active' ? '#10B981'
          : status === 'warning' ? '#F59E0B' : '#EF4444',
      }}
      animate={{
        scale: [1, 1.4, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const vehicles = [
    { x: 22, y: 35, status: 'active', delay: 0 },
    { x: 45, y: 50, status: 'warning', delay: 0.4 },
    { x: 60, y: 25, status: 'active', delay: 0.8 },
    { x: 75, y: 60, status: 'active', delay: 1.2 },
    { x: 30, y: 70, status: 'danger', delay: 0.6 },
    { x: 55, y: 40, status: 'active', delay: 1.0 },
    { x: 82, y: 38, status: 'active', delay: 0.2 },
    { x: 15, y: 55, status: 'active', delay: 1.4 },
  ]

  const headlineWords = ['Every vehicle.', 'Every driver.', 'One command center.']

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.4) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] text-xs text-slate-400 mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse-dot" />
        Fleet operations platform — built for modern logistics
      </motion.div>

      <div className="text-center mb-6 max-w-4xl">
        {headlineWords.map((word, i) => (
          <motion.div
            key={word}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight tracking-tight"
          >
            {word}
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 text-base sm:text-lg max-w-xl text-center mb-10 leading-relaxed px-2"
      >
        Real-time visibility into vehicles, drivers, inspections, and compliance —
        from a single intelligent dashboard built for logistics teams.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-3 mb-12 w-full sm:w-auto px-4 sm:px-0"
      >
        <Link href="/signup" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center px-6 py-3 text-sm min-h-[48px]">
          Start free trial
          <ArrowRight size={15} />
        </Link>
        <Link href="/login" className="btn-ghost flex items-center gap-2 w-full sm:w-auto justify-center px-6 py-3 text-sm min-h-[48px]">
          Sign in to dashboard
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-16 text-xs text-slate-500 px-4"
      >
        {['No credit card required', '7-day free trial', 'Cancel anytime'].map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            {t}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.8, duration: shouldReduceMotion ? 0 : 0.7 }}
        className={`w-full max-w-4xl mx-auto px-2 sm:px-0 ${shouldReduceMotion ? '' : 'animate-float'}`}
      >
        <div
          className="card-glass rounded-xl sm:rounded-2xl overflow-hidden"
          style={{
            transform: shouldReduceMotion ? 'none' : 'perspective(1200px) rotateX(2deg)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(59,130,246,0.08)',
          }}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <div className="text-xs text-slate-500 font-mono hidden sm:block">fleetpulsehq.com/dashboard</div>
            <div className="flex items-center gap-2">
              <span className="badge badge-active text-[10px] sm:text-xs">48 Active</span>
              <span className="badge badge-warning text-[10px] sm:text-xs">3 Alerts</span>
            </div>
          </div>

          <div className="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2 bg-navy-700/50 rounded-xl h-40 sm:h-52 relative overflow-hidden border border-white/[0.04]">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="absolute top-3 left-3 text-[10px] text-slate-500 font-mono">Fleet map — New York</div>
              {vehicles.map((v, i) => (
                <VehicleDot key={i} {...v} />
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              {[
                { label: 'Active vehicles', value: '48', icon: Zap, color: 'text-emerald-400' },
                { label: 'Oil overdue', value: '12', icon: Shield, color: 'text-amber-400' },
                { label: 'Inspections today', value: '7', icon: Map, color: 'text-blue-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.04] flex items-center justify-center ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className={`text-lg sm:text-xl font-mono font-semibold ${color}`}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="h-16 sm:h-24 -mt-4 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-base))' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-3 gap-4 sm:gap-12 w-full max-w-sm sm:max-w-lg mx-auto border-t border-white/[0.06] pt-8"
      >
        <AnimatedCounter end={57} label="Vehicles tracked" />
        <AnimatedCounter end={40} label="Active drivers" />
        <AnimatedCounter end={2500} label="Inspections logged" />
      </motion.div>
    </section>
  )
}
