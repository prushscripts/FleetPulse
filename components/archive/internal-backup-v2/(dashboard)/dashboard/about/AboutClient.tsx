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

  const tiers: Array<{
    name: string
    tagline: string
    price: string
    period: string
    billingNote: string
    maxVehicles: number
    features: string[]
    color: string
    popular?: boolean
  }> = [
    {
      name: 'Starter',
      tagline: 'For smaller fleets to organize vehicle inventory & manage inspections',
      price: '$3',
      period: 'per vehicle, per month',
      billingNote: 'Billed annually or $4 billed monthly',
      maxVehicles: 25,
      features: [
        'Basic vehicle tracking',
        'Service records',
        'Issue tracking',
        'Email support',
      ],
      color: 'gray',
    },
    {
      name: 'Professional',
      tagline: 'For growing fleets to improve service tracking, communication & reporting',
      price: '$6',
      period: 'per vehicle, per month',
      billingNote: 'Billed annually only',
      maxVehicles: 100,
      features: [
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
      tagline: 'For advanced fleets to integrate fleet systems & customize workflows',
      price: '$9',
      period: 'per vehicle, per month',
      billingNote: 'Billed annually only',
      maxVehicles: Infinity,
      features: [
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero: corporate, minimal */}
      <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Welcome, {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">FleetPulse</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fleet management platform</p>
        </div>
      </section>

      {/* Tabs: clean, no scale/pulse */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pricing'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Pricing
          </button>
        </div>
      </div>

      {/* Content with smooth slide transitions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-visible">
        <div className="relative min-h-[400px] overflow-visible">
          {/* Features Tab - scrollable, no clip */}
          <div
            className={`transition-all duration-500 ease-in-out overflow-visible ${
              activeTab === 'features'
                ? 'opacity-100 translate-x-0 block'
                : 'absolute inset-0 opacity-0 translate-x-[-100%] pointer-events-none overflow-hidden'
            }`}
          >
              <div className="space-y-4 pb-16">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Fleet management features
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Vehicle tracking, drivers, inspections, and reporting.
                </p>
              </div>
              <div className="max-h-[calc(100dvh-320px)] overflow-y-auto overflow-x-hidden overscroll-behavior-smooth rounded-lg pr-1 -mr-1">
              <div className="space-y-4">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* Pricing Tab */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === 'pricing'
                ? 'opacity-100 translate-x-0'
                : 'absolute inset-0 opacity-0 translate-x-[100%] pointer-events-none overflow-hidden'
            }`}
          >
            <div className="space-y-10">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Pricing</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Per-vehicle pricing</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier, idx) => {
                  const isPopular = !!tier.popular
                  const isPremium = tier.name === 'Premium'
                  const cardWrapperClass = isPopular
                    ? 'relative bg-indigo-600 dark:bg-indigo-700 rounded-lg border border-indigo-500 dark:border-indigo-600 p-6'
                    : `relative bg-white dark:bg-gray-800 rounded-lg border p-6 ${
                        isPremium ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700'
                      }`
                  return (
                    <div key={idx} className={cardWrapperClass}>
                      {isPopular ? (
                        <div className="absolute top-4 right-4 text-xs font-medium text-indigo-200">
                          Popular
                        </div>
                      ) : null}
                      <h3 className={`text-2xl font-bold mb-1 ${isPopular ? 'text-white pt-0' : 'text-gray-900 dark:text-white'}`}>{tier.name}</h3>
                      <p className={`text-sm mb-4 ${isPopular ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>{tier.tagline}</p>
                      <div className="mb-2">
                        <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.price}</span>
                        <span className={`text-sm ml-2 ${isPopular ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'}`}>{tier.period}</span>
                      </div>
                      <p className={`text-xs mb-2 ${isPopular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>{tier.billingNote}</p>
                      <p className={`text-xs mb-6 ${isPopular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tier.maxVehicles === Infinity ? 'Unlimited vehicles' : `Up to ${tier.maxVehicles} vehicles`}
                      </p>
                      <ul className="space-y-4 mb-8">
                        {tier.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start text-sm">
                            <span className={`mr-3 mt-0.5 text-lg ${isPopular ? 'text-white' : 'text-green-500'}`}>✓</span>
                            <span className={isPopular ? 'text-indigo-100' : 'text-gray-700 dark:text-gray-300'}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={`text-center pt-4 border-t ${isPopular ? 'border-indigo-400/50' : 'border-gray-200 dark:border-gray-700'}`}>
                        <span className={`text-sm font-medium ${isPopular ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          {userTier === tier.name.toLowerCase() ? '✓ Your current tier' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fleet management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Go to dashboard or contact support.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="mailto:fleetpulse@fastmail.com"
              className="inline-block px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
