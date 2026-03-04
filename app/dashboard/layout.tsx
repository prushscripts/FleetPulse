'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Define tab order for navigation direction detection
const TAB_ORDER: Record<string, number> = {
  '/home': 0,
  '/dashboard': 1,
  '/dashboard/drivers': 2,
  '/dashboard/inspections': 3,
  '/dashboard/about': 4,
  '/dashboard/admin': 5,
  '/dashboard/settings': 6,
}

function getTabIndex(pathname: string): number {
  if (TAB_ORDER[pathname] !== undefined) {
    return TAB_ORDER[pathname]
  }
  
  for (const [path, index] of Object.entries(TAB_ORDER)) {
    if (pathname.startsWith(path)) {
      return index
    }
  }
  
  return -1
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevTabIndexRef = useRef<number>(-1)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentTabIndex = getTabIndex(pathname)
    const prevTabIndex = prevTabIndexRef.current

    if (isInitialMount.current) {
      isInitialMount.current = false
      prevTabIndexRef.current = currentTabIndex
      return
    }

    if (currentTabIndex !== -1 && prevTabIndex !== -1 && currentTabIndex !== prevTabIndex) {
      const direction = currentTabIndex > prevTabIndex ? 'right' : 'left'
      setSlideDirection(direction)
      setIsAnimating(true)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
      }, 400)

      prevTabIndexRef.current = currentTabIndex
      return () => clearTimeout(timer)
    } else {
      if (currentTabIndex !== -1) {
        prevTabIndexRef.current = currentTabIndex
      }
    }
  }, [pathname])

  const getAnimationClass = () => {
    if (!isAnimating || !slideDirection) return ''
    
    if (slideDirection === 'right') {
      return 'animate-tab-slide-in-right'
    } else {
      return 'animate-tab-slide-in-left'
    }
  }

  return (
    <div className={`w-full ${getAnimationClass()}`} style={{ 
      animationDuration: '400ms',
      animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      animationFillMode: 'both'
    }}>
      {children}
    </div>
  )
}
