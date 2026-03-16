'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  { name: 'Starter', price: '$3', period: 'per vehicle / month', billing: 'Billed annually or $4/mo', description: 'For smaller fleets getting organized', features: ['Basic vehicle tracking', 'Service records', 'Issue tracking', 'Manual service reminders', 'Email support'], cta: 'Get started', href: '/signup', featured: false },
  { name: 'Professional', price: '$6', period: 'per vehicle / month', billing: 'Billed annually', description: 'For growing fleets with full operations', features: ['Everything in Starter', 'Driver management', 'Digital inspections', 'Fleet health dashboard', 'CSV import/export', 'Advanced analytics'], cta: 'Get started', href: '/signup', featured: true },
  { name: 'Premium', price: '$9', period: 'per vehicle / month', billing: 'Billed annually', description: 'For enterprise fleets needing integrations', features: ['Everything in Professional', 'Advanced analytics', 'API access', 'Custom integrations + roles', 'Dedicated support', 'Priority support'], cta: 'Contact sales', href: '/signup', featured: false },
]

export default function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="pricing" className="py-20 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-slate-400 mb-4">
            <span className="w-1 h-1 rounded-full bg-accent-blue" />
            Simple pricing
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Transparent. Scalable.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            14-day free trial. No credit card required.
          </p>
        </motion.div>

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-4 sm:overflow-visible sm:pb-0 snap-x snap-mandatory sm:snap-none scroll-smooth">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className={`relative flex-shrink-0 w-72 sm:w-auto snap-start sm:snap-align-none card-glass p-6 sm:p-8 flex flex-col min-w-0 ${
                plan.featured
                  ? 'border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.12)]'
                  : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent-blue rounded-full text-[10px] font-semibold text-white whitespace-nowrap">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <div className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-display font-bold text-white font-mono">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <div className="text-xs text-slate-500">{plan.billing}</div>
                <p className="text-sm text-slate-400 mt-3">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={plan.featured ? 'btn-primary text-sm text-center py-3 min-h-[48px] flex items-center justify-center' : 'btn-ghost text-sm text-center py-3 min-h-[48px] flex items-center justify-center'}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          * Priced per vehicle/month. Final pricing may vary by fleet size and contract term.
        </p>
      </div>
    </section>
  )
}
