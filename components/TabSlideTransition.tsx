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
  const [showPrev, setShowPrev] = useState(false)

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

    // Only animate if we're switching between known tabs and pathname actually changed
    if (pathname !== prevPathnameRef.current && currentTabIndex !== -1 && prevTabIndex !== -1 && currentTabIndex !== prevTabIndex) {
      const direction = currentTabIndex > prevTabIndex ? 'right' : 'left'
      setSlideDirection(direction)
      
      // Store previous children for exit animation
      setPrevChildren(currentChildren)
      setShowPrev(true)
      setIsAnimating(true)
      
      // Update children immediately
      setCurrentChildren(children)

      // Reset animation state after animation completes
      const resetTimer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
        setPrevChildren(null)
        setShowPrev(false)
      }, 500)

      prevTabIndexRef.current = currentTabIndex
      prevPathnameRef.current = pathname

      return () => {
        clearTimeout(resetTimer)
      }
    } else if (pathname !== prevPathnameRef.current) {
      // Pathname changed but not a tab switch, just update without animation
      prevPathnameRef.current = pathname
      if (currentTabIndex !== -1) {
        prevTabIndexRef.current = currentTabIndex
      }
      setCurrentChildren(children)
    }
  }, [pathname, children, currentChildren])

  return (
    <div 
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ overflowY: 'visible' }}
    >
      {/* Previous page sliding out */}
      {showPrev && prevChildren && (
        <div 
          className={`absolute inset-0 w-full transition-all duration-500 ease-in-out ${
            isAnimating
              ? (slideDirection === 'right' 
                  ? 'translate-x-[-100%] opacity-0' 
                  : 'translate-x-[100%] opacity-0')
              : 'translate-x-0 opacity-100'
          }`}
          style={{ zIndex: 1 }}
        >
          {prevChildren}
        </div>
      )}
      
      {/* Current page sliding in */}
      <div 
        className={`w-full transition-all duration-500 ease-in-out ${
          isAnimating 
            ? (slideDirection === 'right' 
                ? 'translate-x-[100%] opacity-0' 
                : 'translate-x-[-100%] opacity-0')
            : 'translate-x-0 opacity-100'
        }`}
        style={{ 
          position: showPrev && isAnimating ? 'relative' : 'static',
          zIndex: showPrev && isAnimating ? 2 : 1,
        }}
      >
        {currentChildren}
      </div>
    </div>
  )
}
