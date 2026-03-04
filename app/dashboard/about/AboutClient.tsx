'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { normalizeTier, SubscriptionTier } from '@/lib/tiers'

export default function AboutClient({ displayName }: { displayName: string }) {
  const [activeTab, setActiveTab] = useState<'features' | 'pricing'>('features')
  const [userTier, setUserTier] = useState<SubscriptionTier>('professional')
  const supabase = createClient()

  useEffect(() => {
    const loadTier = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserTier(normalizeTier(user.user_metadata?.subscription_tier))
      }
    }
    loadTier()
  }, [supabase])

  const features = [
    {
      title: 'Vehicle Tracking',
      description: 'Track mileage, oil changes, and maintenance schedules for all your vehicles.',
      icon: '🚗',
    },
    {
      title: 'Driver Management',
      description: 'Assign drivers to vehicles and track driver assignments and performance.',
      icon: '👤',
    },
    {
      title: 'Digital Inspections',
      description: 'Conduct pre-trip and post-trip inspections with photo documentation.',
      icon: '📋',
    },
    {
      title: 'Service Records',
      description: 'Maintain complete service history with costs and provider information.',
      icon: '🔧',
    },
    {
      title: 'Issue Tracking',
      description: 'Report and track vehicle issues with priority levels and status updates.',
      icon: '⚠️',
    },
    {
      title: 'Document Management',
      description: 'Store and track important documents with expiration date reminders.',
      icon: '📄',
    },
    {
      title: 'Fleet Health Dashboard',
      description: 'Monitor fleet health with oil change percentages and inspection statistics.',
      icon: '📊',
    },
    {
      title: 'CSV Import',
      description: 'Bulk import vehicles from CSV files for quick setup.',
      icon: '📥',
    },
    {
      title: 'Mobile Friendly',
      description: 'Access your fleet data anywhere with our responsive design.',
      icon: '📱',
    },
  ]

  const tiers = [
    {
      name: 'Starter',
      price: '$3',
      period: '/vehicle/month',
      maxVehicles: 25,
      features: [
        'Up to 25 vehicles',
        'Basic vehicle tracking',
        'Service records',
        'Issue tracking',
        'Email support',
      ],
      color: 'gray',
    },
    {
      name: 'Professional',
      price: '$6',
      period: '/vehicle/month',
      maxVehicles: 100,
      features: [
        'Up to 100 vehicles',
        'Everything in Starter',
        'Driver management',
        'Digital inspections',
        'Fleet health dashboard',
        'CSV import/export',
        'Priority support',
      ],
      color: 'indigo',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$9',
      period: '/vehicle/month',
      maxVehicles: Infinity,
      features: [
        'Unlimited vehicles',
        'Everything in Professional',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
      ],
      color: 'purple',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Compact Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-8 sm:py-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-indigo-800/90" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Welcome back, {displayName}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">FleetPulse</h1>
          <p className="text-sm sm:text-base text-indigo-100 max-w-2xl">Modern fleet management platform</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1 inline-flex">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'features'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Pricing
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'features' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Everything you need to manage your fleet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Powerful features at a fraction of the cost</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                >
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Choose the plan that fits your fleet size</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 p-6 ${
                    tier.popular
                      ? 'border-indigo-500 scale-105 shadow-xl'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">{tier.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">*Billed annually</p>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start text-sm">
                        <span className="text-green-500 mr-2 mt-0.5">✓</span>
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {userTier === tier.name.toLowerCase() ? '✓ Your current tier' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to streamline your fleet management?</h2>
          <p className="text-indigo-100 mb-6">You're already set up and ready to go!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Go to Dashboard
            </Link>
            <a
              href="mailto:fleetpulse@fastmail.com"
              className="inline-block px-8 py-3 bg-indigo-700/90 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-all border-2 border-white/40 hover:border-white/60 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
