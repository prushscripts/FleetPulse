'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Truck, Users, ClipboardCheck, BarChart3, Bell, FileText } from 'lucide-react'

const features = [
  { icon: Truck, title: 'Vehicle tracking', description: 'Track mileage, oil changes, and maintenance schedules. Get automated alerts before issues become breakdowns.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Users, title: 'Driver management', description: 'Assign drivers to vehicles, track performance, and maintain complete driver records in one place.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: ClipboardCheck, title: 'Digital inspections', description: 'Pre-trip and post-trip inspections with photo documentation, sign-off workflows, and audit trails.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: BarChart3, title: 'Fleet analytics', description: 'Monitor fleet health, oil change percentages, and operational efficiency from a unified dashboard.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Bell, title: 'Smart alerts', description: 'Compliance reminders, document expiration alerts, and service due notifications delivered instantly.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: FileText, title: 'Document management', description: 'Store registrations, insurance, and permits with expiration tracking — never miss a renewal again.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: (index % 3) * 0.08, duration: 0.5 }}
      className="card-glass p-5 sm:p-6 group cursor-default"
    >
      <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={20} className={feature.color} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export default function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="py-20 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-slate-400 mb-4">
            <span className="w-1 h-1 rounded-full bg-accent-blue" />
            Everything in one platform
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Built for how fleets<br className="hidden sm:block" /> actually operate
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Every tool your operations team needs — without the enterprise bloat or the spreadsheet chaos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
