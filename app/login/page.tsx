'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import EntryAnimation from '@/components/EntryAnimation'

const ENTRY_DURATION_MS = 2200

type CompanyOption = { id: string; name: string; displayName?: string; roadmapOnly?: boolean }

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
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
        const res = await fetch('/api/companies-for-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: raw }),
        })
        const data = await res.json()
        const list = data?.companies ?? []
        setCompanies(list)
        if (list.length === 1) {
          setSelectedCompany(list[0])
        } else {
          setSelectedCompany(list[0] ?? null)
        }
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
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || 'An error occurred during login')
        setLoading(false)
        return
      }

      const companyToSet = selectedCompany ?? (companies.length === 1 ? companies[0] : null)
      if (companyToSet) {
        await supabase.auth.updateUser({
          data: {
            company_id: companyToSet.id,
            company_name: companyToSet.displayName || companyToSet.name,
          },
        })
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session) {
        setLoading(false)
        setShowEntry(true)
        const isRoadmapOnly = companyToSet?.roadmapOnly || (companyToSet?.name || '').toLowerCase().includes('roadmap')
        const redirectTo = isRoadmapOnly ? '/dashboard/roadmap' : '/home'
        setTimeout(() => {
          router.push(redirectTo)
          window.location.href = redirectTo
        }, ENTRY_DURATION_MS)
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
    <>
      {showEntry && <EntryAnimation />}
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950/95 via-gray-900 to-purple-950/95 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/90">
      {/* Animated grid - stronger */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-50 animate-auth-grid"
        style={{
          backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.18) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20 animate-auth-grid"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(139, 92, 246, 0.06) 40px, rgba(139, 92, 246, 0.06) 41px), repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(99, 102, 241, 0.06) 40px, rgba(99, 102, 241, 0.06) 41px)',
          backgroundSize: '100% 100%',
          animationDuration: '22s',
        }}
      />
      {/* Pulsing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-indigo-500/25 dark:bg-indigo-500/20 blur-[120px] pointer-events-none animate-auth-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-[440px] h-[440px] rounded-full bg-purple-500/22 dark:bg-purple-600/18 blur-[100px] pointer-events-none animate-auth-pulse-slow" />
      <div className="absolute top-1/2 right-1/3 w-[380px] h-[380px] rounded-full bg-indigo-400/18 dark:bg-indigo-500/15 blur-[80px] pointer-events-none animate-auth-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent pointer-events-none animate-auth-scan" />
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none animate-auth-scan" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-5">
            <video
              src="/Animations/possibleLogoLoop.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-label="FleetPulse"
              className="h-36 sm:h-44 md:h-52 w-auto max-w-[560px] sm:max-w-[640px] object-contain mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-300">
            Sign in to your account
          </p>
        </div>

        {/* Login Card — compact, professional */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/80 p-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Company selector: shown when we found companies for this email */}
            {companies.length > 0 && (
              <div ref={companyDropdownRef} className="relative">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Open as
                </label>
                {companiesLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Finding your companies…</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowCompanyDropdown((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    >
                      <span className="truncate">
                        {selectedCompany ? (selectedCompany.displayName || selectedCompany.name) : 'Select company'}
                      </span>
                      <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCompanyDropdown && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 max-h-48 overflow-auto">
                        {companies.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(c)
                              setShowCompanyDropdown(false)
                            }}
                            className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                              selectedCompany?.id === c.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {c.displayName || c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      You’ll land in this company after signing in.
                    </p>
                  </>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link
                href="#"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            New to FleetPulse?{' '}
            <Link href="/signup" className="font-medium text-indigo-300 hover:text-white">
              Create an account
            </Link>
          </p>

          <div className="mt-3 text-center">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[11px] text-gray-400">Secure login with SSL</span>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
