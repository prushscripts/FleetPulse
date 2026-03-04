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
  const childrenKeyRef = useRef(0)

  useEffect(() => {
    const currentTabIndex = getTabIndex(pathname)
    const prevTabIndex = prevTabIndexRef.current

    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevTabIndexRef.current = currentTabIndex
      prevPathnameRef.current = pathname
      setCurrentChildren(children)
      childrenKeyRef.current++
      return
    }

    // Only animate if we're switching between known tabs and pathname actually changed
    if (pathname !== prevPathnameRef.current && currentTabIndex !== -1 && prevTabIndex !== -1 && currentTabIndex !== prevTabIndex) {
      const direction = currentTabIndex > prevTabIndex ? 'right' : 'left'
      setSlideDirection(direction)
      
      // Store previous children for exit animation
      setPrevChildren(currentChildren)
      setIsAnimating(true)
      
      // Use setTimeout to ensure DOM updates before animation
      setTimeout(() => {
        setCurrentChildren(children)
        childrenKeyRef.current++
      }, 10)

      // Reset animation state after animation completes
      const resetTimer = setTimeout(() => {
        setIsAnimating(false)
        setSlideDirection(null)
        setPrevChildren(null)
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
      childrenKeyRef.current++
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
          key={`prev-${childrenKeyRef.current - 1}`}
          className="absolute inset-0 w-full"
          style={{ 
            zIndex: 1,
            transform: slideDirection === 'right' ? 'translateX(-100%)' : 'translateX(100%)',
            opacity: 0,
            transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform, opacity'
          }}
        >
          {prevChildren}
        </div>
      )}
      
      {/* Current page sliding in */}
      <div 
        key={`current-${childrenKeyRef.current}`}
        className="w-full"
        style={{ 
          position: prevChildren && isAnimating ? 'relative' : 'static',
          zIndex: prevChildren && isAnimating ? 2 : 1,
          transform: isAnimating 
            ? (slideDirection === 'right' ? 'translateX(0)' : 'translateX(0)')
            : 'translateX(0)',
          opacity: isAnimating ? 1 : 1,
          transition: isAnimating 
            ? 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'none',
          willChange: isAnimating ? 'transform, opacity' : 'auto'
        }}
        ref={(el) => {
          if (el && isAnimating && slideDirection) {
            // Set initial position for slide-in animation
            const initialTransform = slideDirection === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
            el.style.transform = initialTransform
            el.style.opacity = '0'
            
            // Trigger animation after a frame
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.style.transform = 'translateX(0)'
                el.style.opacity = '1'
              })
            })
          }
        }}
      >
        {currentChildren}
      </div>
    </div>
  )
}
