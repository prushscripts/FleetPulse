'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import IntroAnimation from '@/components/animations/IntroAnimation'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import CtaSection from '@/components/landing/CtaSection'
import Footer from '@/components/landing/Footer'

/**
 * Client wrapper for the landing page. Intro animation plays every load (no sessionStorage gate).
 */
export default function LandingClient() {
  const [introComplete, setIntroComplete] = useState(false)

  const handleIntroComplete = () => setIntroComplete(true)

  return (
    <main className="bg-[#0A0F1E] min-h-screen" role="main">
      <IntroAnimation onComplete={handleIntroComplete} />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={
          introComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }
        }
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="min-h-screen w-full"
      >
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
        <Footer />
      </motion.div>
    </main>
  )
}
