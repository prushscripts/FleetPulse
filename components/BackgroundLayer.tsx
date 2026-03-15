'use client'

/**
 * Global background layer. Does not affect layout or pointer events.
 * position: fixed, inset: 0, z-index: 0, pointer-events: none
 */
export default function BackgroundLayer() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, #050810 0%, #0a0e18 50%, #080c14 100%)',
      }}
      aria-hidden
    />
  )
}
