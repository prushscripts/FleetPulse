'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ConstellationBackground from '@/components/animations/ConstellationBackground'
import LoginTransition from '@/components/animations/LoginTransition'

type CompanyOption = { id: string; name: string; displayName?: string }

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLoginTransition, setShowLoginTransition] = useState(false)
  const [loginRedirectUrl, setLoginRedirectUrl] = useState<string>('/dashboard/fleet-health')
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()


  useEffect(() => {
    const raw = email.trim().toLowerCase()
    if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      setCompanies([])
      setSelectedCompany(null)
      return
    }
    const t = setTimeout(async () => {
      setCompaniesLoading(true)
      try {
        const res = await fetch('/api/companies-for-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: raw }) })
        const data = await res.json()
        const list = data?.companies ?? []
        setCompanies(list)
        setSelectedCompany(list.length === 1 ? list[0] : list[0] ?? null)
      } catch {
        setCompanies([])
        setSelectedCompany(null)
      } finally {
        setCompaniesLoading(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [email])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) setShowCompanyDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message || 'An error occurred during login')
        setLoading(false)
        return
      }
      const companyToSet = selectedCompany ?? (companies.length === 1 ? companies[0] : null)
      if (companyToSet) {
        await supabase.auth.updateUser({ data: { company_id: companyToSet.id, company_name: companyToSet.displayName || companyToSet.name } })
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session) {
        const role = (data.user?.user_metadata?.role as string | undefined) || 'owner'
        if (role === 'driver') {
          setLoginRedirectUrl('/driver')
          setShowLoginTransition(true)
          return
        }
        setLoginRedirectUrl('/dashboard/fleet-health')
        setShowLoginTransition(true)
      } else {
        setError('Session not established. Please try again.')
        setLoading(false)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0A0F1E] flex flex-row">
      {showLoginTransition && (
        <LoginTransition
          redirectOnComplete
          onComplete={() => {
            if (typeof window !== 'undefined' && loginRedirectUrl === '/dashboard/fleet-health') {
              try { sessionStorage.setItem('fleetpulse-login-landing', '1') } catch {}
            }
            window.location.href = loginRedirectUrl
          }}
        />
      )}
      {loading && !showLoginTransition && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />
          <div className="rounded-xl shadow-2xl border border-white/10 px-10 py-8 flex flex-col items-center justify-center relative z-10 bg-[#0A0F1E]/95">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-3">Signing in…</p>
          </div>
        </div>
      )}

      {/* LEFT PANEL — only on large screens */}
      <div className={`hidden lg:flex lg:w-[42%] xl:w-[45%] relative bg-[#0F1629] border-r border-white/[0.06] flex-col justify-between p-12 overflow-hidden min-h-screen ${loading ? 'blur-sm' : ''}`}>
        <ConstellationBackground />

        {/* Fleet stats card — centered in left panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 z-10">
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 uppercase tracking-widest font-medium">
                Live fleet network
              </span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Vehicles tracked', value: '12,847', sub: '+124 today' },
                { label: 'Inspections logged', value: '94,231', sub: '+18 today' },
                { label: 'Miles monitored', value: '2.4M', sub: 'this month' },
                { label: 'Platform uptime', value: '99.9%', sub: 'last 30 days' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <span className="text-xs text-slate-500">{label}</span>
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold text-white">{value}</div>
                    <div className="text-[10px] text-slate-600">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-white/[0.05]">
              {['Vehicle tracking', 'Inspections', 'Driver management', 'Fleet analytics'].map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] border border-white/[0.06] text-slate-600">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <Link href="/">
            <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
          </Link>
        </div>
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-glass p-6 rounded-2xl mb-6">
            <div className="text-amber-400 text-sm mb-2">★★★★★</div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
              &quot;FleetPulse transformed how we manage our 57-vehicle New York fleet. Oil tracking alone saves us thousands in missed service costs.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">MT</div>
              <div>
                <div className="text-xs font-medium text-white">Operations Manager</div>
                <div className="text-[10px] text-slate-500">Logistics company, New York</div>
              </div>
            </div>
          </motion.div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock size={12} className="text-slate-600" />
            Secured by 256-bit SSL
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — always visible, takes all space on mobile */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 min-h-screen w-full ${loading ? 'blur-md' : ''}`}>
        <div className="w-full max-w-sm">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
            <div className="lg:hidden mb-8 flex justify-center">
              <Link href="/">
                <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">Welcome back</h1>
              <p className="text-sm text-slate-400">Sign in to your fleet dashboard</p>
            </div>

            <form onSubmit={handleLogin} action="#" method="get" className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-sm flex items-start gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 min-h-[48px] bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {companies.length > 0 && (
                <div ref={companyDropdownRef} className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open as</label>
                  {companiesLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm text-slate-500 rounded-xl border border-white/[0.1] bg-white/[0.04]">
                      <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                      <span>Finding your companies…</span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowCompanyDropdown((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] text-sm text-left bg-white/[0.04] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-blue-500/60"
                      >
                        <span className="truncate">{selectedCompany ? (selectedCompany.displayName || selectedCompany.name) : 'Select company'}</span>
                        <svg className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {showCompanyDropdown && (
                        <div className="absolute z-20 mt-1 w-full rounded-xl border border-white/[0.1] bg-navy-800 shadow-lg py-1 max-h-48 overflow-auto">
                          {companies.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedCompany(c); setShowCompanyDropdown(false) }}
                              className={`w-full px-4 py-2.5 text-left text-sm min-h-[44px] ${selectedCompany?.id === c.id ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-white/[0.04]'}`}
                            >
                              {c.displayName || c.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">You’ll land in this company after signing in.</p>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                  <Link href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 min-h-[48px] pr-12 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 min-h-[48px] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>Sign in <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              New to FleetPulse?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Create an account</Link>
            </p>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
              <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Back to homepage</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
