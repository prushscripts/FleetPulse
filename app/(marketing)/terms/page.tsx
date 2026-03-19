import type { Metadata } from 'next'
import LandingNavbar from '@/components/layout/LandingNavbar'

export const metadata: Metadata = { title: 'Terms of Service — FleetPulse' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <LandingNavbar />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <p>
            By accessing or using FleetPulse, you agree to these terms. If you do not agree, do not use the service.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Service description</h2>
          <p>
            FleetPulse provides software for fleet visibility, vehicle and driver records, inspections, and related workflows. Features may change as we improve the product.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Accounts & responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your credentials and for activity under your account. You agree to provide accurate information and to use the service only for lawful business purposes.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Billing</h2>
          <p>
            Paid plans are generally billed per vehicle or as described at signup. Fees are non-refundable except where required by law. We may change pricing with reasonable notice.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Termination</h2>
          <p>
            You may stop using the service at any time. We may suspend or terminate access for breach of these terms or for operational or legal reasons, with notice where practicable.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, FleetPulse is provided &quot;as is&quot; without warranties of merchantability or fitness for a particular purpose. We are not liable for indirect or consequential damages arising from use of the service.
          </p>
          <h2 className="text-lg font-semibold text-white pt-2">Contact</h2>
          <p>
            <a href="mailto:support@fleetpulsehq.com" className="text-blue-400 hover:text-blue-300">
              support@fleetpulsehq.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
