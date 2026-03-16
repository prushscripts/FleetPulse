'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LOGO_LOOP_VIDEO } from '@/lib/animation-paths'
import ConstellationBackground from '@/components/animations/ConstellationBackground'

const LOGIN_LOADER_HOLD_MS = 1200
const LOGIN_PULSE_MS = 600

type CompanyOption = { id: string; name: string; displayName?: string; roadmapOnly?: boolean }

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginSuccessRedirect, setLoginSuccessRedirect] = useState<string | null>(null)
  const [showPulseBurst, setShowPulseBurst] = useState(false)
  const [loginVideoReady, setLoginVideoReady] = useState(false)
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!loginSuccessRedirect) return
    const t = setTimeout(() => {
      setShowPulseBurst(true)
      setTimeout(() => {
        router.replace(loginSuccessRedirect)
        setLoading(false)
        setLoginSuccessRedirect(null)
        setShowPulseBurst(false)
      }, LOGIN_PULSE_MS)
    }, LOGIN_LOADER_HOLD_MS)
    return () => clearTimeout(t)
  }, [loginSuccessRedirect, router])

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
        const isRoadmapOnly = companyToSet?.roadmapOnly || (companyToSet?.name || '').toLowerCase().includes('roadmap')
        setLoginSuccessRedirect(isRoadmapOnly ? '/dashboard/roadmap' : '/dashboard/home')
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
      {loading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" aria-hidden />
          {!showPulseBurst && (
            <div className="rounded-xl shadow-2xl border border-white/10 backdrop-blur-lg px-10 py-8 flex flex-col items-center justify-center relative z-10 transition-opacity duration-200 bg-navy-800/95" style={{ opacity: loginVideoReady ? 1 : 0 }}>
              <video autoPlay muted playsInline loop preload="auto" src={LOGO_LOOP_VIDEO} className="w-[150px] sm:w-[180px] h-auto object-contain opacity-90" onLoadedData={() => setLoginVideoReady(true)} aria-hidden />
            </div>
          )}
          {showPulseBurst && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="rounded-full w-[120px] h-[120px] animate-login-pulse-burst" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)' }} />
            </div>
          )}
        </div>
      )}

      {/* LEFT PANEL — only on large screens */}
      <div className={`hidden lg:flex lg:w-[42%] xl:w-[45%] relative bg-[#0F1629] border-r border-white/[0.06] flex-col justify-between p-12 overflow-hidden min-h-screen ${loading ? 'blur-sm' : ''}`}>
        <ConstellationBackground />
        <div className="relative z-10">
          <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
        </div>
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-glass p-6 rounded-2xl mb-6">
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
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
              <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
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
