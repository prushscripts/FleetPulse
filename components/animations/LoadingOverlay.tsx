'use client'

import React, { useState, useEffect } from 'react'

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
  const [videoReady, setVideoReady] = useState(false)
  const [entered, setEntered] = useState(false)

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
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none min-h-screen w-full backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        transform: `scale(${scale})`,
        transition: `opacity ${transitionMs}ms ease-out, transform ${transitionMs}ms ease-out`,
      }}
    >
      {/* Hidden video to preload; content renders only when video is ready */}
      <video
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        src={videoSrc}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden
        onLoadedData={() => setVideoReady(true)}
        onError={() => {
          if (videoSrc === LOADING_VIDEO_SRC) setVideoSrc(LOADING_VIDEO_SRC_FALLBACK)
        }}
      />
      {videoReady && (
        <div className="flex flex-col items-center justify-center">
          {/* Glowing pulse ring (scale 1 → 1.1 → 1, opacity pulse, 2s infinite) */}
          <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
            <div
              className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-loader-pulse-ring"
              style={{
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
              }}
            />
            <div
              className="absolute inset-[15%] rounded-full border border-purple-400/30 animate-loader-pulse-ring"
              style={{
                animationDelay: '0.5s',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)',
              }}
            />
            {/* Logo animation inside */}
            <div className="relative z-10 flex items-center justify-center">
              <video
                autoPlay
                muted
                playsInline
                loop
                preload="auto"
                className="w-[160px] sm:w-[200px] h-auto object-contain opacity-95"
                style={{
                  background: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))',
                }}
                aria-hidden
                src={videoSrc}
              />
            </div>
          </div>
          {/* Loader text below */}
          {showText && (
            <p className="mt-6 text-sm font-light uppercase tracking-[0.2em] text-purple-300/90 text-center">
              {textContent}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
