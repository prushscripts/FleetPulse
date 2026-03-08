import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const width = 1200
const height = 630

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 35%, #7c3aed 70%, #5b21b6 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120%',
            height: '60%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            FleetPulse
          </div>
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 500,
              maxWidth: 700,
              textAlign: 'center',
            }}
          >
            Modern fleet management — track vehicles, maintenance & inspections
          </div>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 9999,
              fontSize: 20,
              color: 'white',
              fontWeight: 600,
            }}
          >
            FleetPulseHQ.com
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Type': 'image/png',
      },
    }
  )
}
