import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FleetPulse — Modern Fleet Management'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0A0F1E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top right glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Bottom left glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '200px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Corner TL */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            width: '32px',
            height: '32px',
            borderTop: '1px solid rgba(59,130,246,0.3)',
            borderLeft: '1px solid rgba(59,130,246,0.3)',
          }}
        />
        {/* Corner TR */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '32px',
            height: '32px',
            borderTop: '1px solid rgba(59,130,246,0.3)',
            borderRight: '1px solid rgba(59,130,246,0.3)',
          }}
        />
        {/* Corner BL */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            width: '32px',
            height: '32px',
            borderBottom: '1px solid rgba(59,130,246,0.3)',
            borderLeft: '1px solid rgba(59,130,246,0.3)',
          }}
        />
        {/* Corner BR */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: '32px',
            height: '32px',
            borderBottom: '1px solid rgba(59,130,246,0.3)',
            borderRight: '1px solid rgba(59,130,246,0.3)',
          }}
        />

        {/* Live badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(59,130,246,0.25)',
            background: 'rgba(59,130,246,0.08)',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10B981',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              color: '#94A3B8',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Fleet operations platform
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '68px',
            fontWeight: '800',
            color: '#F8FAFC',
            lineHeight: '1.05',
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            maxWidth: '640px',
          }}
        >
          Every vehicle.{'\n'}Every driver.{'\n'}
          <span style={{ color: '#3B82F6' }}>One command center.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '19px',
            color: '#64748B',
            lineHeight: '1.5',
            maxWidth: '520px',
            marginBottom: '40px',
          }}
        >
          Real-time fleet visibility, digital inspections, driver management, and fleet health analytics.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            'Vehicle Tracking',
            'Digital Inspections',
            'Driver Management',
            'Fleet Health Score',
            'Smart Alerts',
          ].map((f) => (
            <div
              key={f}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                fontSize: '13px',
                color: '#94A3B8',
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Right panel — mini dashboard */}
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '320px',
            background: 'rgba(15,22,41,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mock header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
              fleetpulsehq.com
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10B981',
                  fontSize: '10px',
                }}
              >
                48 Active
              </div>
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(245,158,11,0.1)',
                  color: '#F59E0B',
                  fontSize: '10px',
                }}
              >
                3 Alerts
              </div>
            </div>
          </div>

          {/* Mock stats */}
          <div
            style={{
              display: 'flex',
              padding: '12px 16px',
              gap: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {[
              { label: 'Total', value: '57', color: '#F8FAFC' },
              { label: 'Active', value: '48', color: '#10B981' },
              { label: 'Oil Due', value: '38', color: '#F59E0B' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: '700', color, fontFamily: 'monospace' }}>
                  {value}
                </div>
                <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Mock vehicle rows */}
          {[
            { truck: 'z461', status: 'overdue', label: '+817k mi' },
            { truck: 'z233', status: 'overdue', label: '+216k mi' },
            { truck: 'z420', status: 'ok', label: 'Oil OK' },
            { truck: 'z239', status: 'ok', label: 'Oil OK' },
            { truck: 'z474', status: 'overdue', label: '+97k mi' },
          ].map(({ truck, status, label }) => (
            <div
              key={truck}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                borderLeft: `2px solid ${
                  status === 'overdue' ? '#EF4444' : 'rgba(16,185,129,0.4)'
                }`,
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#F8FAFC', fontFamily: 'monospace' }}>
                {truck}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: status === 'overdue' ? '#EF4444' : '#10B981',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background:
                    status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '80px',
            fontSize: '14px',
            color: '#1E3A5F',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
          }}
        >
          fleetpulsehq.com
        </div>
      </div>
    ),
    { ...size }
  )
}
