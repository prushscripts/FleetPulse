'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import IntroAnimation from '@/components/animations/IntroAnimation'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
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
        initial={{ opacity: introComplete ? 1 : 0, scale: introComplete ? 1 : 1.02 }}
        animate={{ opacity: introComplete ? 1 : 0, scale: introComplete ? 1 : 1.02 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="min-h-screen w-full"
      >
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
        <Footer />
      </motion.div>
    </main>
  )
}
