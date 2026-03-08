'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { SubscriptionTier, normalizeTier, TIER_CONFIG } from '@/lib/tiers'

interface SettingsClientProps {
  user: User
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [nickname, setNickname] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tier, setTier] = useState<SubscriptionTier>('professional')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [companyKeyInput, setCompanyKeyInput] = useState('')
  const [companyActivating, setCompanyActivating] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Load user metadata
    const loadUserData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.user_metadata?.nickname) {
        setNickname(currentUser.user_metadata.nickname)
      } else {
        setNickname(currentUser?.email?.split('@')[0] || '')
      }
      setTier(normalizeTier(currentUser?.user_metadata?.subscription_tier))
      setCompanyId(currentUser?.user_metadata?.company_id ?? null)
      setCompanyName(currentUser?.user_metadata?.company_name ?? null)
    }
    loadUserData()
  }, [supabase])

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Capitalize first letter of nickname
      const capitalizedNickname = nickname.trim().charAt(0).toUpperCase() + nickname.trim().slice(1).toLowerCase()
      
      const { error } = await supabase.auth.updateUser({
        data: { nickname: capitalizedNickname }
      })

      if (error) throw error

      setNickname(capitalizedNickname) // Update local state with capitalized version
      setMessage({ type: 'success', text: 'Nickname updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update nickname' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { subscription_tier: tier },
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Subscription tier updated.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update tier' })
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = companyKeyInput.trim()
    if (!key) {
      setCompanyError('Enter your company authentication key.')
      return
    }
    setCompanyActivating(true)
    setCompanyError(null)
    try {
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('auth_key', key)
        .maybeSingle()
      if (fetchError) throw fetchError
      if (!company) {
        setCompanyError('Invalid company key. Check the key and try again.')
        setCompanyActivating(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({
        data: { company_id: company.id, company_name: company.name },
      })
      if (updateError) throw updateError
      setCompanyId(company.id)
      setCompanyName(company.name)
      setCompanyKeyInput('')
      setMessage({ type: 'success', text: 'Company activated. You now have access to your company data.' })
      setTimeout(() => setMessage(null), 4000)
      router.refresh()
    } catch (err: any) {
      setCompanyError(err?.message || 'Activation failed.')
    } finally {
      setCompanyActivating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Company / Authentication key */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Company</h2>
          {companyId && companyName ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active company:</span>
              <span className="font-medium text-gray-900 dark:text-white">{companyName}</span>
            </div>
          ) : (
            <form onSubmit={handleCompanyActivate} className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Enter your company authentication key to access your fleet data. Your administrator provides this key.
              </p>
              <input
                type="text"
                value={companyKeyInput}
                onChange={(e) => setCompanyKeyInput(e.target.value)}
                placeholder="Company authentication key"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {companyError && (
                <p className="text-sm text-red-600 dark:text-red-400">{companyError}</p>
              )}
              <button
                type="submit"
                disabled={companyActivating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {companyActivating ? 'Activating…' : 'Activate'}
              </button>
            </form>
          )}
        </div>

        {/* Nickname Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Display Name</h2>
          <form onSubmit={handleUpdateNickname}>
            <div className="mb-4">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your preferred display name"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This name will be displayed throughout the application</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Nickname'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Subscription Tier</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Internal setting for feature limits and per-vehicle pricing simulation.
          </p>
          <form onSubmit={handleUpdateTier} className="space-y-3">
            <select
              value={tier}
              onChange={(e) => setTier(normalizeTier(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="starter">Starter (${TIER_CONFIG.starter.pricePerVehicleMonthly}/vehicle)</option>
              <option value="professional">
                Professional (${TIER_CONFIG.professional.pricePerVehicleMonthly}/vehicle)
              </option>
              <option value="premium">Premium (${TIER_CONFIG.premium.pricePerVehicleMonthly}/vehicle)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max vehicles on this tier: {TIER_CONFIG[tier].maxVehicles}
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              Save Tier
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Must be at least 6 characters</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
