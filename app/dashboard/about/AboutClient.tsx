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
              <span>Welcome back, {displayName.charAt(0).toUpperCase() + displayName.slice(1)}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">FleetPulse</h1>
          <p className="text-sm sm:text-base text-indigo-100 max-w-2xl">Modern fleet management platform</p>
        </div>
      </section>

      {/* Enhanced Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="flex gap-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-2 inline-flex">
          <button
            onClick={() => setActiveTab('features')}
            className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'features'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span className="relative z-10">Features</span>
            {activeTab === 'features' && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl animate-pulse opacity-20" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`relative px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'pricing'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span className="relative z-10">Pricing</span>
            {activeTab === 'pricing' && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl animate-pulse opacity-20" />
            )}
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
            <div className="space-y-8 pb-16">
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mb-4">
                  <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Comprehensive Features
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Everything you need to manage your fleet
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Powerful features at a fraction of the cost
                </p>
              </div>
              {/* Scrollable features list so all 9 are visible */}
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden overscroll-behavior-smooth rounded-2xl pr-1 -mr-1">
              <div className="space-y-8">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className={`group relative overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl ${
                      idx % 2 === 0
                        ? 'bg-gradient-to-r from-white to-indigo-50/50 dark:from-gray-800 dark:to-indigo-900/20'
                        : 'bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-900/20 dark:to-gray-800'
                    }`}
                  >
                    {/* Decorative gradient overlay */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      idx % 2 === 0
                        ? 'bg-gradient-to-r from-indigo-500/10 to-transparent'
                        : 'bg-gradient-to-r from-transparent to-purple-500/10'
                    }`} />
                    
                    <div className={`relative p-8 flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}>
                      {/* Icon Section */}
                      <div className={`flex-shrink-0 ${idx % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                        <div className="relative">
                          <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity ${
                            idx % 2 === 0 ? 'bg-indigo-500' : 'bg-purple-500'
                          }`} />
                          <div className={`relative w-24 h-24 rounded-2xl flex items-center justify-center text-5xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                            idx % 2 === 0 
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/50'
                              : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50'
                          }`}>
                            {feature.icon}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content Section */}
                      <div className={`flex-1 ${idx % 2 === 0 ? 'md:order-2' : 'md:order-1'} text-center md:text-left`}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                          {feature.description}
                        </p>
                      </div>
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
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Simple, transparent pricing
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">Per-vehicle pricing that scales with your operation</p>
              </div>
              {/* Extra padding so hover scale doesn't clip card edges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 py-4 overflow-visible">
                {tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 p-8 transition-all duration-300 hover:scale-105 overflow-visible ${
                      tier.popular
                        ? 'border-indigo-500 shadow-2xl shadow-indigo-500/30 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-px left-0 right-0 bg-indigo-600 text-white text-center py-1.5 rounded-t-2xl text-xs font-bold">
                        MOST POPULAR
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 pt-2">{tier.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tier.tagline}</p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">{tier.period}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{tier.billingNote}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                      {tier.maxVehicles === Infinity ? 'Unlimited vehicles' : `Up to ${tier.maxVehicles} vehicles`}
                    </p>
                    <ul className="space-y-4 mb-8">
                      {tier.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm">
                          <span className="text-green-500 mr-3 mt-0.5 text-lg">✓</span>
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {userTier === tier.name.toLowerCase() ? '✓ Your current tier' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
