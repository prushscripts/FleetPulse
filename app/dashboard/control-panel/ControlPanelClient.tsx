'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  { id: 'default', label: 'Default', description: 'Standard fleet dashboard layout' },
  { id: 'compact', label: 'Compact', description: 'Dense layout for power users' },
  { id: 'executive', label: 'Executive', description: 'High-level KPIs and summaries' },
]

export default function ControlPanelClient({
  companyId,
  initialTemplate,
  initialInspectionsEnabled,
  initialTerritorySegments,
  trialEndsAt,
}: {
  companyId: string | null | undefined
  initialTemplate: string
  initialInspectionsEnabled: boolean
  initialTerritorySegments: string[]
  trialEndsAt: string | null
}) {
  const [template, setTemplate] = useState(initialTemplate)
  const [inspectionsEnabled, setInspectionsEnabled] = useState(initialInspectionsEnabled)
  const [territoryInput, setTerritoryInput] = useState(initialTerritorySegments.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setTemplate(initialTemplate)
    setInspectionsEnabled(initialInspectionsEnabled)
    setTerritoryInput(initialTerritorySegments.join(', '))
  }, [initialTemplate, initialInspectionsEnabled, initialTerritorySegments])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      setMessage({ type: 'error', text: 'No company selected. Add or activate a company in Settings.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const existing = (user?.user_metadata?.company_settings as Record<string, object>) || {}
      const segments = territoryInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const updated = {
        ...existing,
        [companyId]: {
          template,
          inspectionsEnabled,
          territorySegments: segments,
        },
      }
      const { error } = await supabase.auth.updateUser({
        data: { company_settings: updated },
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Settings saved. Refresh the page to see nav and dashboard updates.' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Control Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add or activate a company in Settings to customize your fleet view, templates, and features.
          </p>
          <a href="/dashboard/settings" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customize your fleet dashboard: template, features, and home segments.
          </p>
        </div>

        {trialDaysLeft !== null && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left. Limit: 5 trucks. Upgrade to keep full access.
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Template</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose a layout style for your dashboard. More templates (and CSV import) coming soon.
            </p>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <label key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{t.label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Features</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inspectionsEnabled}
                onChange={(e) => setInspectionsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Inspection system</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show Inspections tab and inspection tracking. Turn off if you don’t use inspections.
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Home dashboard segments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Optional labels for territory/region tabs on the home page (e.g. New York, DMV). Comma-separated. Leave blank for “Full fleet” only.
            </p>
            <input
              type="text"
              value={territoryInput}
              onChange={(e) => setTerritoryInput(e.target.value)}
              placeholder="e.g. New York, DMV, West"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
