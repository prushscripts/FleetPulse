'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function TabSlideTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [currentChildren, setCurrentChildren] = useState(children)
  const [exitChildren, setExitChildren] = useState<React.ReactNode>(null)
  const prevPathnameRef = useRef<string>('')
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevPathnameRef.current = pathname
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
      {exitChildren != null && (
        <div
          className="absolute inset-0 w-full"
          style={{
            opacity: phase === 'exiting' ? 0 : 1,
            transition: 'opacity 150ms ease',
            zIndex: 1,
          }}
        >
          {exitChildren}
        </div>
      )}
      <div
        className="w-full"
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
