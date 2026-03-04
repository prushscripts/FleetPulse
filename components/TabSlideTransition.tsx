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
  // Check exact matches first
  if (TAB_ORDER[pathname] !== undefined) {
    return TAB_ORDER[pathname]
  }
  
  // Check prefix matches
  for (const [path, index] of Object.entries(TAB_ORDER)) {
    if (pathname.startsWith(path)) {
      return index
    }
  }
  
  return -1
}

export default function TabSlideTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevChildren, setPrevChildren] = useState<React.ReactNode>(null)
  const [currentChildren, setCurrentChildren] = useState<React.ReactNode>(children)
  const prevPathnameRef = useRef<string>('')
  const prevTabIndexRef = useRef<number>(-1)
  const isInitialMount = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentTabIndex = getTabIndex(pathname)
    const prevTabIndex = prevTabIndexRef.current

    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevTabIndexRef.current = currentTabIndex
      prevPathnameRef.current = pathname
      setCurrentChildren(children)
      return
    }

    // Only animate if we're switching between known tabs
    if (currentTabIndex !== -1 && prevTabIndex !== -1 && currentTabIndex !== prevTabIndex) {
      const direction = currentTabIndex > prevTabIndex ? 'right' : 'left'
      setSlideDirection(direction)
      setIsAnimating(true)
      
      // Store previous children for exit animation
      setPrevChildren(currentChildren)
      // Immediately set new children for entrance animation
      setCurrentChildren(children)

      // Reset animation state after animation completes
      const resetTimer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
        setPrevChildren(null)
      }, 400)

      prevTabIndexRef.current = currentTabIndex
      prevPathnameRef.current = pathname

      return () => {
        clearTimeout(resetTimer)
      }
    } else {
      prevPathnameRef.current = pathname
      if (currentTabIndex !== -1) {
        prevTabIndexRef.current = currentTabIndex
      }
      setCurrentChildren(children)
    }
  }, [pathname, children])

  const getExitAnimationClass = () => {
    if (!isAnimating || !slideDirection || !prevChildren) return ''
    if (slideDirection === 'right') {
      return 'animate-tab-slide-out-left'
    } else {
      return 'animate-tab-slide-out-right'
    }
  }

  const getEnterAnimationClass = () => {
    if (!isAnimating || !slideDirection) return ''
    if (slideDirection === 'right') {
      return 'animate-tab-slide-in-right'
    } else {
      return 'animate-tab-slide-in-left'
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ minHeight: '100vh', width: '100%' }}
    >
      {/* Previous page sliding out */}
      {prevChildren && isAnimating && (
        <div 
          className={`absolute inset-0 w-full ${getExitAnimationClass()}`}
          style={{ 
            zIndex: 1,
            animationDuration: '400ms',
            animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            animationFillMode: 'forwards'
          }}
        >
          {prevChildren}
        </div>
      )}
      
      {/* Current page sliding in */}
      <div 
        className={`w-full ${isAnimating ? getEnterAnimationClass() : ''}`}
        style={{ 
          position: prevChildren && isAnimating ? 'relative' : 'static',
          zIndex: prevChildren && isAnimating ? 2 : 1,
          animationDuration: '400ms',
          animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          animationFillMode: 'forwards'
        }}
      >
        {currentChildren}
      </div>
    </div>
  )
}
