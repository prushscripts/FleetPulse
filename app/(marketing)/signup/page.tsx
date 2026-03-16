'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import EntryAnimation from '@/components/animations/EntryAnimation'
import ConstellationBackground from '@/components/animations/ConstellationBackground'

const inputClass = 'w-full px-4 py-3 min-h-[48px] bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyKey, setCompanyKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEntry, setShowEntry] = useState(false)
  const [redirectOnComplete, setRedirectOnComplete] = useState<string | null>(null)
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
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
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
            data: { company_id: company.id, company_name: company.name, companies: [{ id: company.id, name: company.name }] },
          })
          setRedirectOnComplete('/home')
          setShowEntry(true)
        } else {
          setRedirectOnComplete('/dashboard/welcome')
          setShowEntry(true)
        }
      } else {
        setRedirectOnComplete('/dashboard/welcome')
        setShowEntry(true)
      }
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
      <div className={`min-h-screen min-h-[100dvh] bg-navy-900 flex relative overflow-hidden ${showEntry ? 'pointer-events-none' : ''}`}>
        <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative bg-[#0F1629] border-r border-white/[0.06] flex-col justify-between p-12 overflow-hidden min-h-screen">
          <ConstellationBackground />
          <div className="relative z-10">
            <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
          </div>
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-glass p-6 rounded-2xl mb-6">
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                &quot;We cut maintenance surprises by 40% in the first quarter. FleetPulse pays for itself.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">JD</div>
                <div>
                  <div className="text-xs font-medium text-white">Fleet Director</div>
                  <div className="text-[10px] text-slate-500">Regional logistics, 80+ vehicles</div>
                </div>
              </div>
            </motion.div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock size={12} className="text-slate-600" />
              Secured by 256-bit SSL
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
            <div className="lg:hidden mb-8 flex justify-center">
              <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">Create your account</h1>
              <p className="text-sm text-slate-400">Start managing your fleet today</p>
            </div>

            <form onSubmit={handleSignup} action="#" method="get" className="space-y-4">
              {error && (
                <div className={`px-3 py-2 rounded-xl text-sm ${error.includes('verify') || error.includes('check your email') ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Company access code <span className="font-normal normal-case">(optional)</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-slate-500 cursor-help text-[10px] font-bold" title="If you don't have an ID, contact your company administration to acquire one.">?</span>
                </label>
                <input id="companyKey" name="companyKey" type="text" autoComplete="off" value={companyKey} onChange={(e) => setCompanyKey(e.target.value)} placeholder="e.g. WheelzUpAPD2026" className={inputClass} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 min-h-[48px] mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>Create account <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-4">🔒 Secure SSL · No credit card required</p>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign in</Link>
            </p>

            <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
              <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Back to homepage</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
