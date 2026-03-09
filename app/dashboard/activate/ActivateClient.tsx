'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ActivateClient({ userEmail }: { userEmail: string }) {
  const [companyKey, setCompanyKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

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
      window.location.href = '/home'
    } catch (err: any) {
      setError(err?.message || 'Activation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Activate your account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your Company Authentication ID (from your welcome email or your administrator) to access your company’s fleet data. You can share this ID with your team so they can sign up and join the same company.
            </p>
          </div>

          <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userEmail}</p>
            <Link
              href="/dashboard/settings"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
            >
              Change password or account details
            </Link>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label htmlFor="companyKey" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Authentication ID
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 cursor-help text-xs font-bold"
                  title="Found in your FleetPulse welcome email, or ask your company administrator."
                >
                  ?
                </span>
              </label>
              <input
                id="companyKey"
                type="text"
                value={companyKey}
                onChange={(e) => setCompanyKey(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoComplete="off"
                autoFocus
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Your administrator or purchaser will provide this key.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Activating…' : 'Activate'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Don’t have a key? Contact your fleet administrator or{' '}
            <a href="mailto:fleetpulse@fastmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              FleetPulse support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
