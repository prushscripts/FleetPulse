'use client'

import Link from 'next/link'

export default function WelcomeClient() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden">
      {/* Subtle mesh gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.15),transparent),radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(139,92,246,0.08),transparent),radial-gradient(ellipse_60%_50%_at_0%_50%,rgba(59,130,246,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_0px_1px_1px,rgba(255,255,255,0)_1px)] bg-[length:100%_4px] opacity-50" aria-hidden />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            You’re in. Next step is yours.
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
            Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">FleetPulse</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Join a company with an invite code, or explore and start your own trial when you’re ready.
          </p>
        </div>

        {/* Company Authentication ID CTA */}
        <div className="mb-16 p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-sm">
          <p className="text-center text-white/80 text-base font-medium mb-2">
            Have your <strong className="text-white">Company Authentication ID</strong>?
          </p>
          <p className="text-center text-white/60 text-sm mb-6">
            You’ll find it in your welcome email from FleetPulse, or get it from your administrator. Use it to sign in and share it with your team so they can join this company.
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard/activate"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Enter Company Authentication ID
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* What FleetPulse can do */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            What FleetPulse can do for you
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-rose-400/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-1.607-1.274-2.915-2.864-2.915A5.23 5.23 0 0011 4.896v3.828c0 .921.656 1.68 1.5 1.864" />
                  </svg>
                ),
                title: 'Vehicles',
                description: 'Track mileage, oil changes, and service records for your entire fleet in one place.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-violet-400/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
                title: 'Drivers',
                description: 'Assign drivers to vehicles, manage locations, and keep writeups and compliance in check.',
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-amber-400/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108v8.586a2.25 2.25 0 002.25 2.25h.75" />
                  </svg>
                ),
                title: 'Inspections',
                description: 'Digital pre-trip and post-trip inspections with photos and sign-offs.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 mb-4 group-hover:bg-white/[0.08] transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="mb-16 p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
          <p className="text-center text-white/70 text-base mb-6">
            Your dashboard will look like this — one place for vehicles, drivers, and inspections.
          </p>
          <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 mb-6">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              </div>
              <span className="text-white/50 text-sm font-medium">Fleet dashboard preview</span>
            </div>
            <p className="text-white/50 text-sm">Add vehicles, assign drivers, run inspections</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="text-center mb-16">
          <p className="text-white/80 text-lg font-medium mb-8">
            Ready to run your own fleet on FleetPulse?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start free trial
            </Link>
            <a
              href="mailto:fleetpulse@fastmail.com?subject=FleetPulse%20purchase%20inquiry"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl border border-white/20 text-white/90 font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Purchase / Contact sales
            </a>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Start a trial to get your own company and invite your team. No credit card required.
          </p>
        </div>

        {/* Learn more */}
        <div className="text-center">
          <Link
            href="/dashboard/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-white/5 font-medium text-sm transition-colors"
          >
            Learn more about FleetPulse
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
