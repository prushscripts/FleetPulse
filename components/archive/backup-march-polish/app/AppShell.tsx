'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppNavbar from './AppNavbar'
import BottomTabBar from './BottomTabBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState(pathname)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setLoading(false)
      setKey(pathname)
    }, 150)
    return () => clearTimeout(t)
  }, [pathname])

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

      <main key={key} className="page-enter pt-16 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>

      <BottomTabBar />
    </div>
  )
}
