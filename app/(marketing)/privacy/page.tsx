import type { Metadata } from 'next'
import LandingNavbar from '@/components/layout/LandingNavbar'

export const metadata: Metadata = { title: 'Privacy Policy — FleetPulse' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <LandingNavbar />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <p>
            FleetPulse (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy describes how we collect, use, and protect information when you use our fleet management service at fleetpulsehq.com and related applications.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Data we collect</h2>
          <p>
            We collect account information (name, email, company), fleet operational data you enter (vehicles, drivers, inspections, documents), and technical data such as IP address and device type for security and reliability.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">How we use it</h2>
          <p>
            We use this data to provide and improve the service, authenticate users, send operational notifications, analyze usage in aggregate, and comply with legal obligations. We do not sell your personal data to third parties.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Storage & processors</h2>
          <p>
            Data is stored with Supabase (database and authentication) and hosted on Vercel and related infrastructure providers. Subprocessors are chosen for security and compliance; access is limited to what is needed to operate the product.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Your rights</h2>
          <p>
            Depending on your region, you may have rights to access, correct, or delete your data. Contact us using the email below to make a request.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Contact</h2>
          <p>
            Questions about this policy:{' '}
            <a href="mailto:support@fleetpulsehq.com" className="text-blue-400 hover:text-blue-300">
              support@fleetpulsehq.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
