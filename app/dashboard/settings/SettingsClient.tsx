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
  type CompanyEntry = { id: string; name: string; displayName?: string }
  const [companies, setCompanies] = useState<CompanyEntry[]>([])
  const [companyKeyInput, setCompanyKeyInput] = useState('')
  const [companyActivating, setCompanyActivating] = useState(false)
  const [companyError, setCompanyError] = useState<string | null>(null)
  const [addCompanyKey, setAddCompanyKey] = useState('')
  const [addCompanyLoading, setAddCompanyLoading] = useState(false)
  const [addCompanyError, setAddCompanyError] = useState<string | null>(null)
  const [editingDisplayNameId, setEditingDisplayNameId] = useState<string | null>(null)
  const [editingDisplayNameValue, setEditingDisplayNameValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'account' | 'companies' | 'billing'>('account')
  const supabase = createClient()
  const router = useRouter()

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: '👤' },
    { id: 'companies' as const, label: 'Companies', icon: '🏢' },
    { id: 'billing' as const, label: 'Billing', icon: '📋' },
  ]

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
      const cid = currentUser?.user_metadata?.company_id ?? null
      const cname = currentUser?.user_metadata?.company_name ?? null
      setCompanyId(cid)
      setCompanyName(cname)
      const list = currentUser?.user_metadata?.companies as CompanyEntry[] | undefined
      if (list?.length) {
        setCompanies(list)
      } else if (cid && cname) {
        setCompanies([{ id: cid, name: cname }])
      } else {
        setCompanies([])
      }
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
      const existing = companies.filter((c) => c.id !== company.id)
      const merged = existing.length === companies.length ? [...companies, { id: company.id, name: company.name, displayName: company.name }] : companies
      const { error: updateError } = await supabase.auth.updateUser({
        data: { company_id: company.id, company_name: company.name, companies: merged },
      })
      if (updateError) throw updateError
      setCompanyId(company.id)
      setCompanyName(company.name)
      setCompanies(merged)
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

  const companyLogoSlug = (c: CompanyEntry) => {
    let n = (c.displayName || c.name).toLowerCase()
    n = n.replace(/\s*(group|llc|inc|co|corp|ltd)\.?(\s*(group|llc|inc|co|corp|ltd)\.?)*\s*$/gi, '').trim()
    return n.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  }

  const handleSaveDisplayName = async (c: CompanyEntry, newDisplayName: string) => {
    const trimmed = newDisplayName.trim() || c.name
    const updated = companies.map((ent) =>
      ent.id === c.id ? { ...ent, displayName: trimmed === ent.name ? undefined : trimmed } : ent
    )
    const { error } = await supabase.auth.updateUser({ data: { companies: updated } })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setCompanies(updated)
    setEditingDisplayNameId(null)
    setEditingDisplayNameValue('')
    if (companyId === c.id) {
      await supabase.auth.updateUser({ data: { company_name: trimmed } })
      setCompanyName(trimmed)
      router.refresh()
    }
    setMessage({ type: 'success', text: 'Display name updated.' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDeleteCompany = async (c: CompanyEntry) => {
    const next = companies.filter((ent) => ent.id !== c.id)
    const newCurrentId = companyId === c.id ? (next[0]?.id ?? null) : companyId
    const newCurrentName = companyId === c.id ? (next[0] ? (next[0].displayName ?? next[0].name) : null) : companyName
    const { error } = await supabase.auth.updateUser({
      data: {
        companies: next,
        ...(newCurrentId !== null && { company_id: newCurrentId, company_name: newCurrentName }),
      },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setDeleteConfirmId(null)
      return
    }
    setCompanies(next)
    setCompanyId(newCurrentId)
    setCompanyName(newCurrentName)
    setDeleteConfirmId(null)
    setMessage({ type: 'success', text: 'Company removed from your account.' })
    setTimeout(() => setMessage(null), 3000)
    router.refresh()
  }

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = addCompanyKey.trim()
    if (!key) {
      setAddCompanyError('Enter a company authentication key.')
      return
    }
    setAddCompanyLoading(true)
    setAddCompanyError(null)
    try {
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('auth_key', key)
        .maybeSingle()
      if (fetchError) throw fetchError
      if (!company) {
        setAddCompanyError('Invalid company key. Check the key and try again.')
        setAddCompanyLoading(false)
        return
      }
      if (companies.some((c) => c.id === company.id)) {
        setAddCompanyError('You already have access to this company.')
        setAddCompanyLoading(false)
        return
      }
      const merged = [...companies, { id: company.id, name: company.name, displayName: company.name }]
      const { error: updateError } = await supabase.auth.updateUser({
        data: { companies: merged },
      })
      if (updateError) throw updateError
      setCompanies(merged)
      setAddCompanyKey('')
      setMessage({ type: 'success', text: `Added "${company.name}". Switch to it using the company switcher at the top of the page.` })
      setTimeout(() => setMessage(null), 4000)
      router.refresh()
    } catch (err: any) {
      setAddCompanyError(err?.message || 'Failed to add company.')
    } finally {
      setAddCompanyLoading(false)
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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account, companies, and security
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tab bar - compact, only as wide as tabs */}
        <div className="flex justify-start mb-6">
          <div className="inline-flex gap-0.5 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow border border-gray-200/80 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content - two columns on desktop so no scroll */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
          {activeTab === 'account' && (
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left: Account info + Display name */}
                <div className="space-y-5">
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Account info</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                        />
                        <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User ID</label>
                        <input
                          type="text"
                          value={user.id}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 cursor-not-allowed font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </section>
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Display name</h2>
                    <form onSubmit={handleUpdateNickname} className="space-y-2">
                      <input
                        id="nickname"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Shown in app"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      />
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </form>
                  </section>
                </div>
                {/* Right: Password */}
                <div>
                  <section>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Password</h2>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current</label>
                        <input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                      </div>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="p-5 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">My Companies</h2>

              {/* Logo upload hint */}
              <div className="mb-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Company logo</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Add an image at <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px]">public/images/companylogos/&#123;slug&#125;.png</code> or <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px]">.jpg</code> (e.g. <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px]">wheelzup.png</code>, <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-[11px]">prushlogistics.jpg</code>) to show it in the navbar. Use lowercase, no spaces; suffixes like “Group” or “LLC” are stripped automatically.
                    </p>
                  </div>
                </div>
              </div>

              {companies.length === 0 ? (
                <form onSubmit={handleCompanyActivate} className="space-y-4 max-w-md">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your company authentication key to access your fleet data.
                  </p>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company authentication key
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-gray-500 cursor-help text-xs font-bold" title="If you don't have an ID, contact your company administration to acquire one.">?</span>
                  </label>
                  <input
                    type="text"
                    value={companyKeyInput}
                    onChange={(e) => setCompanyKeyInput(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {companyError && <p className="text-sm text-red-600 dark:text-red-400">{companyError}</p>}
                  <button type="submit" disabled={companyActivating} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                    {companyActivating ? 'Activating…' : 'Activate'}
                  </button>
                </form>
              ) : (
                <>
                  <ul className="space-y-2 mb-6">
                    {companies.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 sm:gap-3 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-gray-900 dark:text-white min-w-0 truncate">
                          {editingDisplayNameId === c.id ? (
                            <span className="flex items-center gap-2 flex-wrap">
                              <input
                                type="text"
                                value={editingDisplayNameValue}
                                onChange={(e) => setEditingDisplayNameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDisplayName(c, editingDisplayNameValue); if (e.key === 'Escape') { setEditingDisplayNameId(null); setEditingDisplayNameValue(''); } }}
                                className="w-40 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                                autoFocus
                              />
                              <button type="button" onClick={() => handleSaveDisplayName(c, editingDisplayNameValue)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Save</button>
                              <button type="button" onClick={() => { setEditingDisplayNameId(null); setEditingDisplayNameValue(''); }} className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400">Cancel</button>
                            </span>
                          ) : (
                            <>
                              {c.displayName ?? c.name}
                              {c.displayName && <span className="text-gray-500 dark:text-gray-400 text-xs font-normal"> ({c.name})</span>}
                            </>
                          )}
                        </span>
                        {companyId === c.id && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Current</span>
                        )}
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 w-full sm:w-auto">Logo: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{companyLogoSlug(c)}.png</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.jpg</code></span>
                        {editingDisplayNameId !== c.id && (
                          <button
                            type="button"
                            onClick={() => { setEditingDisplayNameId(c.id); setEditingDisplayNameValue(c.displayName ?? c.name); }}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit display name"
                          >
                            Edit name
                          </button>
                        )}
                        {deleteConfirmId === c.id ? (
                          <span className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Remove?</span>
                            <button type="button" onClick={() => handleDeleteCompany(c)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Yes</button>
                            <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400">No</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c.id)}
                            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Remove company from account"
                            aria-label="Delete company"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Add another company</p>
                    <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Company invite code
                          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-400 text-gray-500 cursor-help text-[10px] font-bold" title="If you don't have an ID, contact your company administration to acquire one.">?</span>
                        </label>
                        <input
                          type="text"
                          value={addCompanyKey}
                          onChange={(e) => setAddCompanyKey(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button type="submit" disabled={addCompanyLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium whitespace-nowrap">
                          {addCompanyLoading ? 'Adding…' : 'Add company'}
                        </button>
                      </div>
                    </form>
                    {addCompanyError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addCompanyError}</p>}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-5 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Subscription Tier</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Feature limits and per-vehicle pricing.</p>
              <form onSubmit={handleUpdateTier} className="max-w-md space-y-4">
                <select
                  value={tier}
                  onChange={(e) => setTier(normalizeTier(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                >
                  <option value="starter">Starter (${TIER_CONFIG.starter.pricePerVehicleMonthly}/vehicle)</option>
                  <option value="professional">Professional (${TIER_CONFIG.professional.pricePerVehicleMonthly}/vehicle)</option>
                  <option value="premium">Premium (${TIER_CONFIG.premium.pricePerVehicleMonthly}/vehicle)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Max vehicles: {TIER_CONFIG[tier].maxVehicles}</p>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow disabled:opacity-50">
                  Save Tier
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
