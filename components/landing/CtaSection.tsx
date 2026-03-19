'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CtaSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-20 sm:py-32 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <div
            className="card-glass rounded-2xl sm:rounded-3xl p-8 sm:p-16 relative overflow-hidden"
            style={{ boxShadow: '0 0 80px rgba(59,130,246,0.08)' }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.8), transparent 70%)',
              }}
            />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 relative">
              Ready to take control<br className="hidden sm:block" /> of your fleet?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-8 relative">
              Join fleet managers who trust FleetPulse to keep their operations running.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Link href="/signup" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-3.5 min-h-[48px]">
                Start your free trial
                <ArrowRight size={15} />
              </Link>
              <a href="mailto:support@fleetpulsehq.com" className="btn-ghost w-full sm:w-auto text-center px-8 py-3.5 min-h-[48px] flex items-center justify-center">
                Talk to sales
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
