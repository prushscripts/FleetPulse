'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ActivateClient({ userDisplayName }: { userDisplayName: string }) {
  const [companyKey, setCompanyKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = companyKey.trim()
    if (!key) {
      setError('Enter your Company Authentication ID.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let company: { id: string; name: string } | null = null
      const { data: rpcRows, error: rpcError } = await supabase.rpc('get_company_by_invite_code', { invite_code: key })
      if (!rpcError && Array.isArray(rpcRows) && rpcRows.length) company = rpcRows[0] as { id: string; name: string }
      if (!company) {
        const { data: d1 } = await supabase.from('companies').select('id, name').eq('auth_key', key).maybeSingle()
        const { data: d2 } = await supabase.from('companies').select('id, name').eq('auth_key', key.toLowerCase()).maybeSingle()
        company = d1 || d2 || null
      }
      if (!company) {
        setError('Invalid Company Authentication ID. Check the ID and try again.')
        setLoading(false)
        return
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const existing = (currentUser?.user_metadata?.companies as { id: string; name: string }[]) ?? []
      const merged = existing.some((c: { id: string }) => c.id === company!.id)
        ? existing
        : [...existing, { id: company!.id, name: company!.name }]

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          company_id: company!.id,
          company_name: company!.name,
          companies: merged,
        },
      })
      if (updateError) throw updateError
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Activation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass rounded-2xl p-8">
        <h1 className="text-2xl font-display font-bold text-white mb-2">Activate your account</h1>
        <p className="text-sm text-slate-400 mb-8">
          Enter your Company Authentication ID (from your welcome email or your administrator) to access your company&apos;s fleet data. You can share this ID with your team so they can sign up and join the same company.
        </p>

        <div className="mb-6 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <p className="text-xs text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm text-white font-medium truncate">{userDisplayName}</p>
          <Link href="/dashboard/settings" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
            Change password or account details
          </Link>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label htmlFor="companyKey" className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
              Company Authentication ID
            </label>
            <input
              id="companyKey"
              type="text"
              value={companyKey}
              onChange={(e) => setCompanyKey(e.target.value)}
              autoComplete="off"
              autoFocus
              className="input-field w-full"
              placeholder=""
            />
            <p className="mt-1.5 text-xs text-slate-600">Your administrator or purchaser will provide this key.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Activating…' : 'Activate'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have a key? Contact your fleet administrator or{' '}
          <a href="mailto:support@fleetpulsehq.com" className="text-blue-400 hover:text-blue-300">
            FleetPulse support
          </a>
          .
        </p>
      </div>
    </div>
  )
}
