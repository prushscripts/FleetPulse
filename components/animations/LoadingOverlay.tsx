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
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none min-h-screen w-full bg-black/30 backdrop-blur-md"
      style={{
        opacity: visible ? 1 : 0,
        transform: `scale(${scale})`,
        transition: `opacity ${transitionMs}ms ease-out, transform ${transitionMs}ms ease-out`,
      }}
    >
      {/* Hidden video to preload; card renders only when video is ready to prevent empty square */}
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
        <div
          className="rounded-xl shadow-2xl border border-white/10 backdrop-blur-lg px-10 py-8 flex flex-col items-center justify-center"
          style={{ background: 'rgba(15,15,25,0.9)' }}
        >
          <div className="relative flex items-center justify-center mb-4">
            <video
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              className="w-[150px] sm:w-[180px] h-auto object-contain opacity-90"
              style={{ background: 'transparent' }}
              aria-hidden
              src={videoSrc}
            />
          </div>
          {showText && (
            <p className="text-xs font-light uppercase tracking-widest text-purple-300/90 text-center">
              {textContent}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
