'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import EntryAnimation from '@/components/EntryAnimation'

const ENTRY_DURATION_MS = 2200

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyKey, setCompanyKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message || 'An error occurred during signup')
        setLoading(false)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData?.session) {
        setError('Account created! Please check your email to verify your account.')
        setLoading(false)
        return
      }

      const key = companyKey.trim()
      if (key) {
        let company: { id: string; name: string } | null = null
        const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_company_by_invite_code', { invite_code: key })
        if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length) company = rpcRows[0] as { id: string; name: string }
        if (!company) {
          const { data: d1 } = await supabase.from('companies').select('id, name').eq('auth_key', key).maybeSingle()
          const { data: d2 } = await supabase.from('companies').select('id, name').eq('auth_key', key.toLowerCase()).maybeSingle()
          company = d1 || d2 || null
        }
        if (company) {
          await supabase.auth.updateUser({
            data: {
              company_id: company.id,
              company_name: company.name,
              companies: [{ id: company.id, name: company.name }],
            },
          })
          setShowEntry(true)
          setTimeout(() => {
            window.location.href = '/home'
          }, ENTRY_DURATION_MS)
        } else {
          setShowEntry(true)
          setTimeout(() => {
            router.push('/dashboard/welcome')
            window.location.href = '/dashboard/welcome'
          }, ENTRY_DURATION_MS)
        }
      } else {
        setShowEntry(true)
        setTimeout(() => {
          router.push('/dashboard/welcome')
          window.location.href = '/dashboard/welcome'
        }, ENTRY_DURATION_MS)
      }
      setLoading(false)
    } catch (err: any) {
      setError(err?.message || 'An error occurred during signup')
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
      {/* Secondary diagonal grid */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20 animate-auth-grid"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(139, 92, 246, 0.06) 40px, rgba(139, 92, 246, 0.06) 41px), repeating-linear-gradient(-45deg, transparent, transparent 40px, rgba(99, 102, 241, 0.06) 40px, rgba(99, 102, 241, 0.06) 41px)',
          backgroundSize: '100% 100%',
          animationDuration: '22s',
        }}
      />
      {/* Pulsing orbs - bigger and more visible */}
      <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-indigo-500/25 dark:bg-indigo-500/20 blur-[120px] pointer-events-none animate-auth-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-[440px] h-[440px] rounded-full bg-purple-500/22 dark:bg-purple-600/18 blur-[100px] pointer-events-none animate-auth-pulse-slow" />
      <div className="absolute top-1/2 right-1/3 w-[380px] h-[380px] rounded-full bg-indigo-400/18 dark:bg-indigo-500/15 blur-[80px] pointer-events-none animate-auth-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-1/4 left-1/2 w-[300px] h-[300px] rounded-full bg-violet-500/15 blur-[70px] pointer-events-none animate-auth-pulse-slow" style={{ animationDelay: '-2s' }} />
      {/* Scan lines - two for more motion */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent pointer-events-none animate-auth-scan" />
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none animate-auth-scan" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      {/* Content - transparent so logo video mix-blend can see through */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 bg-transparent">
      <div className="w-full max-w-sm bg-transparent">
        {/* Logo: screenbend in pure #000000 container so mix-blend-mode: screen works (navy/dark blue left a tint; pure black does not). */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-5" style={{ backgroundColor: '#000000' }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              aria-label="FleetPulse"
              className="logo-video h-40 w-auto object-contain mx-auto"
              style={{ mixBlendMode: 'screen' }}
            >
              <source src="/assets/fleetpulse_screenbend.webm" type="video/webm" />
            </video>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Create Your Account
          </h2>
          <p className="text-sm text-gray-300">
            Start managing your fleet today
          </p>
        </div>

        {/* Signup Card — compact, professional */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/80 p-5">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className={`px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${
                error.includes('verify') || error.includes('check your email')
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              }`}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  {error.includes('verify') || error.includes('check your email') ? (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
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

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="companyKey" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Company invite code <span className="font-normal text-gray-400">(optional)</span>
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-help text-[10px] font-bold"
                  title="If you don't have an ID, contact your company administration to acquire one."
                >
                  ?
                </span>
              </label>
              <input
                id="companyKey"
                name="companyKey"
                type="text"
                autoComplete="off"
                value={companyKey}
                onChange={(e) => setCompanyKey(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder=""
              />
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-300 hover:text-white">
              Sign in
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
          <span className="text-[11px] text-gray-400">Secure signup with SSL</span>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
