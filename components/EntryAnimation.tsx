'use client'

import Image from 'next/image'

export default function EntryAnimation() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a12] overflow-hidden">
      {/* Expanding grid background */}
      <div
        className="absolute inset-0 opacity-0 animate-entry-grid"
        style={{
          backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px)',
          backgroundSize: '100% 100%',
        }}
      />
      {/* Sonar rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border-2 border-indigo-500/60 animate-entry-sonar" />
        <div className="absolute w-64 h-64 rounded-full border-2 border-purple-500/50 animate-entry-sonar-2" />
        <div className="absolute w-64 h-64 rounded-full border-2 border-indigo-400/40 animate-entry-sonar-3" />
      </div>
      {/* Center glow */}
      <div className="absolute w-96 h-96 rounded-full bg-indigo-500/30 blur-[80px] animate-entry-glow pointer-events-none" />
      {/* Logo + text */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="animate-entry-logo">
          <Image
            src="/images/banner1.png"
            alt="FleetPulse"
            width={280}
            height={90}
            className="h-20 w-auto object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            priority
            unoptimized
          />
        </div>
        <p className="mt-6 text-indigo-300/90 text-sm font-medium tracking-[0.3em] uppercase animate-entry-text">
          Entering system
        </p>
        <div className="mt-3 flex gap-1.5 animate-entry-text">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}
