'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import EntryAnimation from '@/components/animations/EntryAnimation'
import ConstellationBackground from '@/components/animations/ConstellationBackground'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [role, setRole] = useState<'manager' | 'driver'>('manager')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const [redirectOnComplete, setRedirectOnComplete] = useState<string | null>(null)
  const [uiReady, setUiReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false
    const maxWait = setTimeout(() => {
      if (!cancelled) setUiReady(true)
    }, 300)
    supabase.auth.getSession().finally(() => {
      if (!cancelled) {
        clearTimeout(maxWait)
        setUiReady(true)
      }
    })
    return () => {
      cancelled = true
      clearTimeout(maxWait)
    }
  }, [supabase])

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
      const formattedNickname = nickname.trim() ? nickname.trim().charAt(0).toUpperCase() + nickname.trim().slice(1) : ''

      const codeRes = await fetch('/api/validate-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode, role }),
      })
      const codeData = await codeRes.json()
      if (!codeData?.valid) {
        setError(codeData?.error || 'Invalid access code. Contact your administrator.')
        setLoading(false)
        return
      }

      const companyId = codeData.company_id as string | undefined
      const companyName = codeData.company_name as string | undefined
      if (!companyId) {
        setError('Invalid access code. Contact your administrator.')
        setLoading(false)
        return
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            company_id: companyId,
            ...(formattedNickname ? { nickname: formattedNickname } : {}),
          },
        },
      })
      if (signUpError) {
        setError(signUpError.message || 'An error occurred during signup')
        setLoading(false)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        setError('Account created! Please check your email to verify your account.')
        setLoading(false)
        return
      }

      await supabase.auth.updateUser({
        data: {
          company_id: companyId,
          ...(companyName ? { company_name: companyName } : {}),
          ...(companyName ? { companies: [{ id: companyId, name: companyName }] } : {}),
          role,
          ...(formattedNickname ? { nickname: formattedNickname } : {}),
        },
      })

      try {
        if (role !== 'driver') sessionStorage.setItem('fp_fresh_login', '1')
      } catch {
        /* ignore */
      }

      setRedirectOnComplete(role === 'driver' ? '/driver' : '/dashboard/fleet-health')
      setShowEntry(true)
      await fetch('/api/sync-profile', { method: 'POST', credentials: 'include' })
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
      setLoading(false)
    }
  }

  return (
    <>
      {showEntry && redirectOnComplete && (
        <EntryAnimation
          onComplete={() => {
            router.push(redirectOnComplete)
            window.location.href = redirectOnComplete
          }}
        />
      )}
      <div
        className={`min-h-screen min-h-[100dvh] bg-[#0A0F1E] flex flex-row relative ${showEntry ? 'pointer-events-none' : ''}`}
      >
        {/* LEFT — match login structure */}
        <div
          className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-[#0F1629] border-r border-white/[0.06] flex-col justify-between p-12 min-h-screen"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <ConstellationBackground />
          <div
            className="absolute w-96 h-96 rounded-full pointer-events-none z-[1] blur-3xl"
            style={{
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            }}
          />

          {!uiReady && (
            <div className="absolute top-1/2 left-10 right-10 z-[10] space-y-3 max-w-sm -translate-y-1/2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-pulse h-8 w-full rounded-xl" />
              ))}
            </div>
          )}

          {uiReady && (
            <div className="relative z-10 mt-auto flex flex-col gap-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card-glass rounded-2xl p-6"
              >
                <div className="text-amber-400 text-sm mb-3 tracking-tight">★★★★★</div>
                <p className="text-sm text-slate-300 leading-relaxed italic mb-5">
                  &quot;We cut maintenance surprises by 40% in the first quarter. FleetPulse pays for itself.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                    JD
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Fleet Director</div>
                    <div className="text-xs text-slate-500">Regional logistics, 80+ vehicles</div>
                  </div>
                </div>
              </motion.div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Lock size={12} className="text-slate-600 shrink-0" />
                Secured by 256-bit SSL
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — centered form */}
        <div className="flex-1 flex items-center justify-center min-h-screen min-h-[100dvh] pt-16 p-6 sm:p-8 w-full overflow-y-auto">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              {!uiReady ? (
                <motion.div
                  key="signup-skeleton"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="lg:hidden mb-6 flex justify-center">
                    <div className="skeleton-pulse h-10 w-40 rounded-xl" />
                  </div>
                  <div className="skeleton-pulse h-9 w-2/3 rounded-xl" />
                  <div className="skeleton-pulse h-4 w-full rounded-xl" />
                  <div className="space-y-3 pt-2">
                    <div className="skeleton-pulse h-11 w-full rounded-xl" />
                    <div className="skeleton-pulse h-11 w-full rounded-xl" />
                    <div className="skeleton-pulse h-11 w-full rounded-xl" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="lg:hidden mb-8 flex justify-center">
                    <Link href="/">
                      <Image
                        src="/branding/fleetpulse-navbar.png"
                        alt="FleetPulse"
                        width={1600}
                        height={410}
                        className="h-10 w-auto"
                      />
                    </Link>
                  </div>

                  <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Create your account</h1>
                    <p className="text-slate-400 text-sm">Start managing your fleet today</p>
                  </div>

                  <form onSubmit={handleSignup} action="#" method="get" className="space-y-3.5">
                    {error && (
                      <div
                        className={`px-3 py-2.5 rounded-xl text-sm ${
                          error.includes('verify') || error.includes('check your email')
                            ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}
                      >
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                        placeholder="you@company.com"
                        className="input-field min-h-[48px] py-3"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="password" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                        placeholder="••••••••"
                        className="input-field min-h-[48px] py-3"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                        placeholder="••••••••"
                        className="input-field min-h-[48px] py-3"
                      />
                    </div>

                    <div className="space-y-2 pt-0.5">
                      <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">I am a...</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('manager')}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                            role === 'manager'
                              ? 'border-blue-500/50 bg-blue-500 text-white shadow-lg shadow-blue-500/10'
                              : 'border-white/[0.1] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:bg-white/[0.05]'
                          }`}
                        >
                          Fleet Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('driver')}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                            role === 'driver'
                              ? 'border-blue-500/50 bg-blue-500 text-white shadow-lg shadow-blue-500/10'
                              : 'border-white/[0.1] bg-white/[0.03] text-slate-400 hover:border-white/[0.14] hover:bg-white/[0.05]'
                          }`}
                        >
                          Driver
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="nickname" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name / nickname
                      </label>
                      <input
                        id="nickname"
                        name="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g. James"
                        maxLength={30}
                        className="input-field min-h-[48px] py-3"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="accessCode" className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {role === 'manager' ? 'Manager Access Code' : 'Driver Access Code'}
                      </label>
                      <input
                        id="accessCode"
                        name="accessCode"
                        type="password"
                        autoComplete="off"
                        required
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder={
                          role === 'manager' ? 'Contact your administrator for access' : 'Contact your fleet manager for your code'
                        }
                        className="input-field min-h-[48px] py-3"
                      />
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {role === 'manager'
                          ? 'Required to create a manager account'
                          : 'Your fleet manager will provide this code'}
                      </p>
                      {error && !error.includes('verify') && !error.includes('check your email') && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                        >
                          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-500 pt-1">🔒 Secure SSL · No credit card required</p>
                  </form>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Sign in
                    </Link>
                  </p>

                  <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                    <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                      ← Back to homepage
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
