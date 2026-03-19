'use client'

import Link from 'next/link'
import {
  Truck,
  Users,
  ClipboardCheck,
  Activity,
  Bell,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

export default function AboutClient() {

  const features = [
    {
      title: 'Vehicle Tracking',
      description:
        'Track mileage, oil changes, and maintenance schedules. Get automated alerts before issues become breakdowns.',
      icon: Truck,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Driver Management',
      description:
        'Assign drivers to vehicles by location. NY and DMV driver pools automatically filter when assigning.',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Digital Inspections',
      description:
        'Pre-trip and post-trip inspections with custom templates, photo documentation, and automatic issue creation on failures.',
      icon: ClipboardCheck,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Fleet Health Score',
      description:
        'Real-time fleet health score based on oil compliance, open issues, and inspection pass rates.',
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Smart Alerts',
      description:
        'Oil change reminders, document expiry alerts, and inspection notifications delivered instantly.',
      icon: Bell,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'Issue Tracking',
      description:
        'Report and track vehicle issues with priority levels. Driver-submitted issues flow directly into your dashboard.',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ]

  const stats = [
    { value: '57', label: 'Vehicles tracked', color: 'text-blue-400' },
    { value: '40+', label: 'Active drivers', color: 'text-emerald-400' },
    { value: '2,500+', label: 'Inspections logged', color: 'text-violet-400' },
    { value: '99.9%', label: 'Platform uptime', color: 'text-amber-400' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      <div className="page-fade-in px-4 md:px-6 py-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06] text-xs text-blue-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            What&apos;s included in your plan
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
            Built for fleets that
            <br />
            <span className="text-blue-400">can&apos;t afford downtime</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            FleetPulse is the modern fleet management platform built for logistics companies who need
            real-time visibility across every vehicle, driver, and inspection.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="card-glass rounded-xl p-5 group hover:border-white/[0.12] transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.bg} mb-3`}
                >
                  <Icon size={20} className={feature.color} />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{feature.description}</p>
                <span className="text-slate-500 group-hover:text-blue-400 transition-colors inline-flex items-center gap-1 text-xs">
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  Learn more
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-16">
          {stats.map(({ value, label, color }) => (
            <div key={label} className="card-glass rounded-2xl p-6 text-center">
              <div className={`text-4xl font-mono font-bold ${color} mb-2`}>{value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
