'use client'

import { useEffect, useState } from 'react'

interface ScrollBlurProps {
  children: React.ReactNode
  className?: string
}

export default function ScrollBlur({ children, className = '' }: ScrollBlurProps) {
  const [blur, setBlur] = useState(3)
  const [opacity, setOpacity] = useState(0.6)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      // Calculate blur based on scroll position
      // Start with blur at top, clear as you scroll down
      const maxBlur = 3 // Reduced from 8
      const blurThreshold = windowHeight * 0.3 // Start clearing after 30% of viewport
      
      if (scrollY < blurThreshold) {
        // Gradually reduce blur as we scroll
        const blurAmount = maxBlur * (1 - scrollY / blurThreshold)
        const opacityAmount = 0.6 + (scrollY / blurThreshold) * 0.4 // Start at 0.6 instead of 0.3
        
        setBlur(Math.max(0, blurAmount))
        setOpacity(Math.min(1, opacityAmount))
      } else {
        setBlur(0)
        setOpacity(1)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        filter: `blur(${blur}px)`,
        opacity: opacity,
        transform: `scale(${0.97 + (opacity - 0.6) * 0.03})`, // Less scale change
      }}
    >
      {children}
    </div>
  )
}
