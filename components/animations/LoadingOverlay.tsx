'use client'

import React from 'react'

export type LoadingOverlayProps = {
  loadingLabel: string
  isExiting?: boolean
}

export default function LoadingOverlay({ loadingLabel, isExiting = false }: LoadingOverlayProps) {
  const displayLabel = loadingLabel || 'Page'
  const showText = !isExiting

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none loading-overlay-root"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 45%, rgba(30, 27, 75, 0.4) 0%, transparent 50%), linear-gradient(180deg, #060810 0%, #0a0e18 40%, #080c14 100%)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Radial glow behind logo */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="w-[320px] h-[120px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="mb-6 loading-overlay-logo-wrap">
          <div className="rounded-2xl overflow-hidden loading-overlay-logo-glow">
            <video
              autoPlay
              muted
              playsInline
              loop
              className="w-[260px] sm:w-[300px] h-auto block"
              style={{
                mixBlendMode: 'screen',
                background: 'transparent',
              }}
              aria-hidden
            >
              <source src="/videos/possibleLogoLoop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {showText && (
          <>
            <p className="loading-overlay-text text-sm font-light uppercase tracking-[0.32em] text-purple-300/90">
              Loading {displayLabel}
            </p>
            <div className="mt-3 w-32 h-0.5 rounded-full bg-gray-700/60 overflow-hidden">
              <div className="h-full rounded-full bg-purple-400/80 loading-overlay-progress" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
