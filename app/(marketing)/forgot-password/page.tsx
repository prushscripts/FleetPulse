'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fleetpulsehq.com'
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/reset-password`,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0A0F1E] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
          </Link>
        </div>

        <h1 className="text-2xl font-display font-bold text-white text-center mb-2">Reset your password</h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Enter your account email and we&apos;ll send you a link to choose a new password.
        </p>

        {sent ? (
          <div className="card-glass rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-300">
              Check your inbox — we&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm text-blue-400 hover:text-blue-300">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
                Enter your account email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-field w-full"
                placeholder="you@company.com"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center">
              <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
                ← Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
