'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return
        setUserEmail(user?.email ?? null)
        const existing =
          (user?.user_metadata?.nickname as string | undefined) ||
          user?.email?.split('@')[0] ||
          ''
        setNickname(existing)
      })
      .catch(() => {
        if (!cancelled) {
          setUserEmail(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [supabase])

  const saveNickname = async () => {
    if (!nickname.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      const trimmed = nickname.trim()
      const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
      const { error } = await supabase.auth.updateUser({
        data: { nickname: formatted },
      })
      if (error) throw error
      setNickname(formatted)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      // swallow; in a real app we might show an error toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Profile &amp; Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your display name and account preferences.
        </p>
      </div>

      {/* Nickname section */}
      <section className="card-glass rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Display Name</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Shown on vehicle notes, inspection sign-offs, and issue reports.
          </p>
        </div>
        <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">
              Your nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl
                text-sm text-white placeholder:text-slate-600
                focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button
            onClick={saveNickname}
            disabled={saving}
            className="btn-primary px-5 py-3 text-sm flex items-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save'
            )}
          </button>
        </div>
        {saved && (
          <div className="px-5 pb-4">
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-400 flex items-center gap-1.5"
            >
              <Check size={12} /> Saved successfully
            </motion.p>
          </div>
        )}
      </section>

      {/* Account info section — read only */}
      <section className="card-glass rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Account</h2>
        </div>
        <div className="px-5 py-5 space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Email</div>
            <div className="text-sm text-white font-mono">
              {userEmail ?? 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Plan</div>
            <div className="text-sm text-white">Professional</div>
          </div>
        </div>
      </section>
    </div>
  )
}

