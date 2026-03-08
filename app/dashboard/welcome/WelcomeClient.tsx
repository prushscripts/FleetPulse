'use client'

import Link from 'next/link'

export default function WelcomeClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to FleetPulse
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            You’re all set. Join a company with an invite code, or explore and start your own trial when you’re ready.
          </p>
        </div>

        {/* Invite code CTA */}
        <div className="mb-12 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20">
          <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
            Already have a company invite code?
          </p>
          <div className="flex justify-center">
            <Link
              href="/dashboard/activate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Enter invite code
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* About / What you get */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            What FleetPulse can do for you
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
              <div className="text-3xl mb-3">🚗</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Vehicles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track mileage, oil changes, and service records for your entire fleet in one place.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Drivers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assign drivers to vehicles, manage locations, and keep writeups and compliance in check.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Inspections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Digital pre-trip and post-trip inspections with photos and sign-offs.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder preview */}
        <div className="mb-12 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your dashboard will look like this — one place for vehicles, drivers, and inspections.
          </p>
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
            <div className="text-4xl text-gray-400 dark:text-gray-500 mb-2">📊</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Fleet dashboard preview</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add vehicles, assign drivers, run inspections</p>
          </div>
        </div>

        {/* Start trial / Purchase */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ready to run your own fleet on FleetPulse?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start free trial
            </Link>
            <a
              href="mailto:fleetpulse@fastmail.com?subject=FleetPulse%20purchase%20inquiry"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Purchase / Contact sales
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Start a trial to get your own company and invite your team. No credit card required.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard/about"
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
          >
            Learn more about FleetPulse →
          </Link>
        </div>
      </div>
    </div>
  )
}
