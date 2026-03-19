'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setSessionReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0A0F1E] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/branding/fleetpulse-navbar.png" alt="FleetPulse" width={1600} height={410} className="h-10 w-auto" />
          </Link>
        </div>
        <h1 className="text-2xl font-display font-bold text-white text-center mb-2">Set new password</h1>
        {!sessionReady && !done && (
          <p className="text-sm text-slate-400 text-center mb-6">Verifying reset link…</p>
        )}
        {done ? (
          <div className="card-glass rounded-2xl p-6 text-center space-y-4">
            <p className="text-sm text-slate-300">Your password has been updated.</p>
            <Link href="/login" className="btn-primary inline-block px-6 py-2 text-sm">
              Sign in
            </Link>
          </div>
        ) : sessionReady ? (
          <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-4">
            <div>
              <label htmlFor="password" className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-field w-full"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
