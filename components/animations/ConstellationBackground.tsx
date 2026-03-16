'use client'

import { useEffect, useRef } from 'react'

export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = canvas.offsetWidth
    let height = canvas.offsetHeight

    const resize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    const PARTICLE_COUNT = 65
    const CONNECTION_DISTANCE = 140
    const PARTICLE_SPEED = 0.35
    const DOT_RADIUS = 1.8
    const LINE_WIDTH = 0.5
    const PARTICLE_COLOR = '59, 130, 246'
    const LINE_COLOR = '59, 130, 246'

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      opacity: number
      pulseOffset: number
      size: number
      isMarker: boolean
    }

    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED,
        opacity: 0.3 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        size: DOT_RADIUS + Math.random() * 1.2,
        isMarker: i < 8,
      })
    )

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
        ctx.fill()
      })
      return () => window.removeEventListener('resize', resize)
    }

    let time = 0

    const draw = () => {
      time += 0.012
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
        p.x = Math.max(0, Math.min(width, p.x))
        p.y = Math.max(0, Math.min(height, p.y))
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.25
            const boost = a.isMarker && b.isMarker ? 2.5 : 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${alpha * boost})`
            ctx.lineWidth = LINE_WIDTH * (a.isMarker || b.isMarker ? 1.5 : 1)
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        const pulse = Math.sin(time * 1.8 + p.pulseOffset) * 0.3 + 0.7
        const currentOpacity = p.opacity * pulse
        if (p.isMarker) {
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size * 4
          )
          gradient.addColorStop(0, `rgba(${PARTICLE_COLOR}, ${currentOpacity * 0.6})`)
          gradient.addColorStop(1, `rgba(${PARTICLE_COLOR}, 0)`)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${PARTICLE_COLOR}, ${currentOpacity * 0.4})`
          ctx.lineWidth = 0.5
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${currentOpacity})`
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${currentOpacity * 0.7})`
          ctx.fill()
        }
      })

      const scanY = ((time * 18) % (height + 60)) - 30
      const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      scanGradient.addColorStop(0, 'rgba(59, 130, 246, 0)')
      scanGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)')
      scanGradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanY - 20, width, 40)

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(10,15,30,0.7) 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(10,15,30,0.4))',
        }}
      />
    </>
  )
}
