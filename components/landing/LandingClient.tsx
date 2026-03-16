'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import IntroAnimation from '@/components/animations/IntroAnimation'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import CtaSection from '@/components/landing/CtaSection'
import Footer from '@/components/landing/Footer'

const INTRO_STORAGE_KEY = 'fp_intro_shown'

/**
 * Client wrapper for the landing page. Shows intro video once per session,
 * then fades in the full landing content.
 */
export default function LandingClient() {
  const [introComplete, setIntroComplete] = useState(false)
  const [shouldShowIntro, setShouldShowIntro] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(INTRO_STORAGE_KEY)
    if (!seen) {
      setShouldShowIntro(true)
    } else {
      setIntroComplete(true)
    }
  }, [])

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
    }
    setIntroComplete(true)
  }

  return (
    <main className="bg-[#0A0F1E] min-h-screen">
      {shouldShowIntro && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: introComplete ? 1 : 0, scale: introComplete ? 1 : 1.05 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CtaSection />
        <Footer />
      </motion.div>
    </main>
  )
}
