'use client'

import React, { useState, useEffect, useRef } from 'react'

export const LOADING_VIDEO_SRC = '/animations/possibleLogoLoop.mp4'
export const LOADING_VIDEO_SRC_FALLBACK = '/Animations/possibleLogoLoop.mp4'

export type LoadingOverlayProps = {
  loadingLabel: string
  isExiting?: boolean
}

const FADE_IN_MS = 250
const FADE_OUT_MS = 350

export default function LoadingOverlay({ loadingLabel, isExiting = false }: LoadingOverlayProps) {
  const [videoSrc, setVideoSrc] = useState(LOADING_VIDEO_SRC)
  const [entered, setEntered] = useState(false)
  const isExitingRef = useRef(false)
  if (isExiting) isExitingRef.current = true

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const displayLabel = loadingLabel || 'Page'
  const isSwitchingCompany = displayLabel.startsWith('Switching to ')
  const textContent = isSwitchingCompany ? displayLabel : `Loading ${displayLabel}`
  const showText = !isExiting

  const visible = entered && !isExiting
  const transitionMs = isExiting ? FADE_OUT_MS : FADE_IN_MS
  const scale = visible ? 1 : isExiting ? 1.02 : 0.98

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none min-h-screen w-full"
      style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: `scale(${scale})`,
        transition: `opacity ${transitionMs}ms ease-out, transform ${transitionMs}ms ease-out`,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div
          className="rounded-xl shadow-2xl border border-white/10 backdrop-blur-lg flex flex-col items-center justify-center p-6 transition-all"
          style={{
            background: 'rgba(15,15,25,0.85)',
            boxShadow: '0 0 40px rgba(139,92,246,0.12)',
          }}
        >
          <div className="relative flex items-center justify-center mb-4">
            <div
              className="absolute inset-0 rounded-lg opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              aria-hidden
            />
            <video
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              className="relative z-10 w-[140px] sm:w-[180px] h-auto object-contain opacity-90"
              style={{ background: 'transparent' }}
              aria-hidden
              onError={() => {
                if (videoSrc === LOADING_VIDEO_SRC) setVideoSrc(LOADING_VIDEO_SRC_FALLBACK)
              }}
              src={videoSrc}
            />
          </div>
          {showText && (
            <p className="text-xs font-light uppercase tracking-widest text-purple-300/90 text-center">
              {textContent}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
