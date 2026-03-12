'use client'

import { useState, useRef } from 'react'

const FADEOUT_MS = 400

export default function EntryAnimation({ onComplete }: { onComplete?: () => void }) {
  const [exiting, setExiting] = useState(false)
  const onCompleteRef = useRef(onComplete)

  onCompleteRef.current = onComplete

  const handleEnded = () => {
    setExiting(true)
    setTimeout(() => {
      onCompleteRef.current?.()
    }, FADEOUT_MS)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity ease-out"
      style={{
        backgroundColor: 'var(--fleet-navy, #0d1120)',
        opacity: exiting ? 0 : 1,
        transitionDuration: `${FADEOUT_MS}ms`,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="w-[380px] h-[80px] flex items-center justify-center mb-6">
          <video
            autoPlay
            muted
            playsInline
            aria-label="FleetPulse"
            onCanPlay={(e) => e.currentTarget.play()}
            onEnded={handleEnded}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            style={{ width: '380px', height: 'auto' }}
          >
            <source src="/assets/possibleLogoLoop.mp4" type="video/mp4" />
          </video>
        </div>
        <p
          className="text-xs uppercase text-indigo-300/80 flex items-center gap-0.5"
          style={{ letterSpacing: '4px' }}
        >
          ENTERING SYSTEM
          <span className="inline-flex gap-0.5 ml-1" aria-hidden>
            <span className="entry-ellipsis-dot w-1 h-1 rounded-full bg-current inline-block" />
            <span className="entry-ellipsis-dot entry-ellipsis-dot-2 w-1 h-1 rounded-full bg-current inline-block" />
            <span className="entry-ellipsis-dot entry-ellipsis-dot-3 w-1 h-1 rounded-full bg-current inline-block" />
          </span>
        </p>
      </div>
    </div>
  )
}
