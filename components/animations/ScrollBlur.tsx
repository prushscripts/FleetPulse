'use client'

import { useEffect, useState, useRef } from 'react'

interface ScrollBlurProps {
  children: React.ReactNode
  className?: string
}

export default function ScrollBlur({ children, className = '' }: ScrollBlurProps) {
  const [blur, setBlur] = useState(3)
  const [opacity, setOpacity] = useState(0.6)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const maxBlur = 3
      const blurThreshold = windowHeight * 0.35

      if (scrollY < blurThreshold) {
        const blurAmount = maxBlur * (1 - scrollY / blurThreshold)
        const opacityAmount = 0.6 + (scrollY / blurThreshold) * 0.4
        setBlur(Math.max(0, blurAmount))
        setOpacity(Math.min(1, opacityAmount))
      } else {
        setBlur(0)
        setOpacity(1)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fallback: when this section enters viewport, ensure unblur (handles edge cases where window scroll isn't the scroller)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const ratio = e.intersectionRatio
            if (ratio >= 0.5) {
              setBlur(0)
              setOpacity(1)
            }
          }
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-20% 0px -20% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={rootRef}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        filter: `blur(${blur}px)`,
        opacity: opacity,
        transform: `scale(${0.97 + (opacity - 0.6) * 0.03})`,
      }}
    >
      {children}
    </div>
  )
}
