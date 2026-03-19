'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import AppNavbar from './AppNavbar'
import BottomTabBar from './BottomTabBar'
import NicknamePromptModal from './NicknamePromptModal'
import { createClient } from '@/lib/supabase/client'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState(pathname)
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false)
  const freshLoginZoomRef = useRef(false)
  const sessionReadRef = useRef(false)
  const supabase = createClient()

  if (typeof window !== 'undefined' && !sessionReadRef.current) {
    sessionReadRef.current = true
    try {
      if (sessionStorage.getItem('fp_fresh_login') === '1') {
        sessionStorage.removeItem('fp_fresh_login')
        freshLoginZoomRef.current = true
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setLoading(false)
      setKey(pathname)
    }, 150)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return
        const nickname = (user?.user_metadata?.nickname as string | undefined) || ''
        if (user && !nickname.trim()) {
          setShowNicknamePrompt(true)
        }
      })
      .catch(() => {
        if (cancelled) return
      })
    return () => {
      cancelled = true
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {loading && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #3B82F6, #60A5FA, transparent)',
            animation: 'shimmer 0.8s linear infinite',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      <AppNavbar />

      <motion.main
        key={key}
        className="page-enter pt-16 pb-24 md:pb-8 min-h-screen"
        initial={freshLoginZoomRef.current ? { opacity: 0, scale: 0.96 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: freshLoginZoomRef.current ? 0.5 : 0.35,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        onAnimationComplete={() => {
          freshLoginZoomRef.current = false
        }}
      >
        {children}
      </motion.main>

      <BottomTabBar />

      <NicknamePromptModal
        open={showNicknamePrompt}
        onSave={async (nickname) => {
          await supabase.auth.updateUser({ data: { nickname } })
          setShowNicknamePrompt(false)
        }}
      />
    </div>
  )
}

