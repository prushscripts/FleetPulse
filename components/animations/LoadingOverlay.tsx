'use client'

import React from 'react'

export type LoadingOverlayProps = {
  loadingLabel: string
  isExiting?: boolean
}

export default function LoadingOverlay({ loadingLabel, isExiting = false }: LoadingOverlayProps) {
  const displayLabel = loadingLabel || 'Page'

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none loading-overlay-root"
      style={{
        background: 'linear-gradient(180deg, #080c18 0%, #0f1420 50%, #080c18 100%)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.25s ease-out',
      }}
    >
      {/* Dark grid / tech pattern */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="mb-6 loading-overlay-logo-wrap">
          <div className="rounded-2xl overflow-hidden loading-overlay-logo-glow">
            <video
              autoPlay
              muted
              playsInline
              className="w-[280px] sm:w-[320px] h-auto block"
              style={{
                mixBlendMode: 'screen',
                background: 'transparent',
              }}
              aria-hidden
            >
              <source src="/videos/fleetpulse_logo_loop.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <p className="loading-overlay-text text-sm font-light uppercase tracking-[0.35em] text-purple-300/80">
          Loading {displayLabel}
        </p>
      </div>
    </div>
  )
}
