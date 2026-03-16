import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={120} height={28} className="h-7 w-auto mb-3" />
            <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
              Modern fleet management for logistics teams.
            </p>
          </div>
          <div>
            <div className="text-xs text-slate-600 uppercase tracking-wider mb-4">Product</div>
            <div className="flex flex-col gap-2.5">
              {[['Features', '#features'], ['Sign in', '/login'], ['Free trial', '/signup']].map(([label, href]) => (
                <Link key={label} href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 uppercase tracking-wider mb-4">Company</div>
            <div className="flex flex-col gap-2.5">
              {[['About', '/about'], ['Contact', 'mailto:fleetpulse@fastmail.com']].map(([label, href]) => (
                <Link key={label} href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 uppercase tracking-wider mb-4">Legal</div>
            <div className="flex flex-col gap-2.5">
              {[['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                <Link key={label} href={href} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">© 2026 FleetPulse. All rights reserved.</p>
          <p className="text-xs text-slate-600">Secured by 256-bit SSL</p>
        </div>
      </div>
    </footer>
  )
}
