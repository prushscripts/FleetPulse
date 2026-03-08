import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)',
          borderRadius: 24,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          FP
        </div>
      </div>
    ),
    { ...size }
  )
}
