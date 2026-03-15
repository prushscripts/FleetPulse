'use client'

import React from 'react'

/** Single source for all loading overlays: tab switch, page transition, company switch. */
export const LOADING_VIDEO_SRC = '/animations/possibleLogoLoop.mp4'

export type LoadingOverlayProps = {
  loadingLabel: string
  isExiting?: boolean
}

export default function LoadingOverlay({ loadingLabel, isExiting = false }: LoadingOverlayProps) {
  const displayLabel = loadingLabel || 'Page'
  const isSwitchingCompany = displayLabel.startsWith('Switching to ')
  const textContent = isSwitchingCompany ? displayLabel : `Loading ${displayLabel}`
  const showText = !isExiting

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none min-h-screen w-full loading-overlay-root"
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 45%, rgba(30, 27, 75, 0.35) 0%, transparent 50%), linear-gradient(180deg, #060810 0%, #0a0e18 40%, #080c14 100%)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Full-screen subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Radial glow behind video */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div
          className="w-[min(90vw,400px)] h-[min(40vw,160px)] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(ellipse 80% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(28px)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="mb-8 loading-overlay-logo-wrap flex justify-center">
          <div
            className="rounded-2xl overflow-hidden loading-overlay-logo-glow flex items-center justify-center"
            style={{
              filter: 'drop-shadow(0 0 40px rgba(147,51,234,0.45))',
            }}
          >
            <video
              autoPlay
              muted
              playsInline
              loop
              className="w-[460px] max-w-[min(90vw,460px)] h-auto block object-contain"
              style={{
                mixBlendMode: 'screen',
                background: 'transparent',
              }}
              aria-hidden
            >
              <source src={LOADING_VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
        </div>

        {showText && (
          <>
            <p className="loading-overlay-text text-sm font-light uppercase tracking-[0.32em] text-purple-300/90 text-center">
              {textContent}
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
