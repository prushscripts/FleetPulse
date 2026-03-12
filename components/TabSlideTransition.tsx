'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

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
  if (TAB_ORDER[pathname] !== undefined) return TAB_ORDER[pathname]
  for (const [path, index] of Object.entries(TAB_ORDER)) {
    if (pathname.startsWith(path)) return index
  }
  return -1
}

export default function TabSlideTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [currentChildren, setCurrentChildren] = useState(children)
  const [exitChildren, setExitChildren] = useState<React.ReactNode>(null)
  const prevPathnameRef = useRef<string>('')
  const prevTabIndexRef = useRef<number>(-1)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentTabIndex = getTabIndex(pathname)
    const prevTabIndex = prevTabIndexRef.current

    if (isInitialMount.current) {
      isInitialMount.current = false
      prevPathnameRef.current = pathname
      prevTabIndexRef.current = currentTabIndex
      setCurrentChildren(children)
      return
    }

    if (pathname !== prevPathnameRef.current) {
      setExitChildren(currentChildren)
      setPhase('exiting')

      const exitTimer = setTimeout(() => {
        setCurrentChildren(children)
        setExitChildren(null)
        prevPathnameRef.current = pathname
        if (currentTabIndex !== -1) prevTabIndexRef.current = currentTabIndex
        setPhase('entering')

        const enterTimer = setTimeout(() => setPhase('idle'), 200)
        return () => clearTimeout(enterTimer)
      }, 150)

      return () => clearTimeout(exitTimer)
    } else {
      setCurrentChildren(children)
    }
  }, [pathname, children])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Exiting: previous content fades out over 150ms */}
      {exitChildren != null && (
        <div
          className="absolute inset-0 w-full page-exit-active"
          style={{
            opacity: phase === 'exiting' ? 0 : 1,
            transition: 'opacity 150ms ease',
            zIndex: 1,
          }}
        >
          {exitChildren}
        </div>
      )}
      {/* Current: fades in over 200ms when entering */}
      <div
        className={`w-full ${phase === 'entering' ? 'page-enter-active' : ''}`}
        style={{
          opacity: phase === 'exiting' ? 0 : 1,
          transition: phase === 'entering' ? 'opacity 200ms ease' : 'none',
          position: exitChildren != null ? 'relative' : 'static',
          zIndex: 2,
        }}
      >
        {currentChildren}
      </div>
    </div>
  )
}
