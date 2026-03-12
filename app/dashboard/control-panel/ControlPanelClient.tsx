'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { createDefaultCustomTemplate } from '@/lib/custom-template'
import Papa from 'papaparse'

const TEMPLATES = [
  { id: 'default', label: 'Default', description: 'Standard fleet dashboard layout' },
  { id: 'compact', label: 'Compact', description: 'Dense layout for power users' },
  { id: 'executive', label: 'Executive', description: 'High-level KPIs and summaries' },
  { id: 'custom', label: 'Custom', description: 'Build your own with sections, layout, and tabs' },
]

const TAB_KEYS = [
  { key: 'home', label: 'Home' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'inspections', label: 'Inspections' },
  { key: 'about', label: 'About' },
  { key: 'roadmap', label: 'Roadmap' },
] as const

type CompanyConfig = {
  auth_key?: string
  enabled_tabs?: string[]
  custom_tab_labels?: Record<string, string>
  inspections_enabled?: boolean
  roadmap_only?: boolean
} | null

export default function ControlPanelClient({
  companyId,
  initialTemplate,
  initialInspectionsEnabled,
  initialTerritorySegments,
  trialEndsAt,
  initialCompanyConfig,
}: {
  companyId: string | null | undefined
  initialTemplate: string
  initialInspectionsEnabled: boolean
  initialTerritorySegments: string[]
  trialEndsAt: string | null
  initialCompanyConfig?: CompanyConfig
}) {
  const [template, setTemplate] = useState(initialTemplate)
  const [inspectionsEnabled, setInspectionsEnabled] = useState(initialInspectionsEnabled)
  const [territoryInput, setTerritoryInput] = useState(initialTerritorySegments.join(', '))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [enabledTabs, setEnabledTabs] = useState<string[]>(initialCompanyConfig?.enabled_tabs ?? TAB_KEYS.map((t) => t.key))
  const [customTabLabels, setCustomTabLabels] = useState<Record<string, string>>(initialCompanyConfig?.custom_tab_labels ?? {})
  const [authKey] = useState(initialCompanyConfig?.auth_key ?? '')
  const [importResult, setImportResult] = useState<{ success: number; error: number; message?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setTemplate(initialTemplate)
    setInspectionsEnabled(initialInspectionsEnabled)
    setTerritoryInput(initialTerritorySegments.join(', '))
  }, [initialTemplate, initialInspectionsEnabled, initialTerritorySegments])

  useEffect(() => {
    if (initialCompanyConfig?.enabled_tabs?.length) setEnabledTabs(initialCompanyConfig.enabled_tabs)
    if (initialCompanyConfig?.custom_tab_labels) setCustomTabLabels(initialCompanyConfig.custom_tab_labels)
  }, [initialCompanyConfig])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      setMessage({ type: 'error', text: 'No company selected. Add or activate a company in Settings.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/update-company-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          enabled_tabs: enabledTabs,
          custom_tab_labels: customTabLabels,
          inspections_enabled: inspectionsEnabled,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || res.statusText)
      }
      const { data: { user } } = await supabase.auth.getUser()
      const existing = (user?.user_metadata?.company_settings as Record<string, object>) || {}
      const segments = territoryInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const currentCompany = (existing[companyId] as Record<string, unknown>) || {}
      const updated = {
        ...existing,
        [companyId]: {
          ...currentCompany,
          template,
          inspectionsEnabled,
          territorySegments: segments,
          ...(template === 'custom' && !currentCompany.customTemplate
            ? { customTemplate: createDefaultCustomTemplate() }
            : {}),
        },
      }
      const { error } = await supabase.auth.updateUser({
        data: { company_settings: updated },
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Configuration saved. Reloading…' })
      setTimeout(() => window.location.reload(), 800)
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const toggleTab = (key: string) => {
    setEnabledTabs((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key].sort((a, b) => TAB_KEYS.findIndex((t) => t.key === a) - TAB_KEYS.findIndex((t) => t.key === b))
    )
  }

  const setCustomLabel = (key: string, value: string) => {
    setCustomTabLabels((prev) => (value.trim() ? { ...prev, [key]: value.trim() } : { ...prev, [key]: '' }))
  }

  const copyAuthCode = () => {
    if (authKey) {
      navigator.clipboard.writeText(authKey)
      setMessage({ type: 'success', text: 'Access code copied to clipboard.' })
      setTimeout(() => setMessage(null), 2000)
    }
  }

  type ImportType = 'vehicles' | 'drivers' | 'service_records'
  const vehicleColumns = ['name', 'year', 'make', 'model', 'vin', 'license_plate', 'mileage', 'status']
  const driverColumns = ['first_name', 'last_name', 'email', 'phone', 'hire_date', 'license_number', 'license_expiration']

  const runCsvImport = async (type: ImportType, file: File) => {
    if (!companyId) return
    setImportResult(null)
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as Record<string, string>[]
          const errors: string[] = []
          let success = 0
          const normalize = (s: string) => (s ?? '').trim().toLowerCase().replace(/\s+/g, '_')
          try {
            if (type === 'vehicles') {
              for (const row of rows) {
                const r: Record<string, unknown> = { company_id: companyId }
                const raw: Record<string, string> = {}
                vehicleColumns.forEach((col) => {
                  const v = row[col] ?? row[normalize(col)] ?? ''
                  if (v !== '') raw[col] = v
                })
                if (raw.name) r.code = raw.name
                if (raw.year) r.year = parseInt(raw.year, 10) || 0
                if (raw.make) r.make = raw.make
                if (raw.model) r.model = raw.model
                if (raw.vin) r.vin = raw.vin
                if (raw.license_plate) r.license_plate = raw.license_plate
                if (raw.mileage !== undefined) r.current_mileage = parseInt(raw.mileage, 10) || 0
                if (raw.status) r.status = raw.status
                if (!r.code) { errors.push('Missing name/code'); continue }
                const { error } = await supabase.from('vehicles').insert(r)
                if (error) errors.push(error.message)
                else success++
              }
            } else if (type === 'drivers') {
              for (const row of rows) {
                const r: Record<string, unknown> = { company_id: companyId }
                driverColumns.forEach((col) => {
                  const v = row[col] ?? row[normalize(col)] ?? ''
                  if (v !== '') r[col] = v
                })
                const { error } = await supabase.from('drivers').insert(r)
                if (error) errors.push(error.message)
                else success++
              }
            } else {
              setImportResult({ success: 0, error: rows.length, message: 'Service records import: map columns in a future update.' })
              resolve()
              return
            }
            setImportResult({ success, error: errors.length, message: errors.slice(0, 3).join('; ') })
          } catch (e: any) {
            setImportResult({ success: 0, error: rows.length, message: e?.message || 'Import failed' })
          }
          resolve()
        },
        error: (err) => {
          setImportResult({ success: 0, error: 1, message: err.message })
          reject(err)
        },
      })
    })
  }

  const triggerCsvImport = (type: ImportType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) runCsvImport(type, file)
    }
    input.click()
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Company Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure your company&apos;s FleetPulse experience. Tabs and labels apply to the navbar for all members.
            </p>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Tab visibility</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TAB_KEYS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledTabs.includes(key)}
                      onChange={() => toggleTab(key)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Custom tab labels</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rename tabs (e.g. Vehicles → Trucks). Leave blank to use default.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TAB_KEYS.filter((t) => enabledTabs.includes(t.key)).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">{label}</span>
                    <input
                      type="text"
                      value={customTabLabels[key] ?? ''}
                      onChange={(e) => setCustomLabel(key, e.target.value)}
                      placeholder={label}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inspectionsEnabled}
                  onChange={(e) => setInspectionsEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-900 dark:text-white">Enable Digital Inspections</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">When off, the Inspections tab is removed from the navbar.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Import data</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Upload CSV files. Columns are mapped by header name (see tooltips).</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => triggerCsvImport('vehicles')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={vehicleColumns.join(', ')}
                >
                  Import Vehicles (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => triggerCsvImport('drivers')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={driverColumns.join(', ')}
                >
                  Import Drivers (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => triggerCsvImport('service_records')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 opacity-75"
                  title="Coming soon"
                >
                  Import Service Records (CSV)
                </button>
              </div>
              {importResult && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {importResult.success} succeeded, {importResult.error} failed.
                  {importResult.message && ` ${importResult.message}`}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Your company access code</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share this with team members so they can join your company during signup.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-gray-900 text-orange-400 font-mono text-sm border border-gray-700 overflow-x-auto">
                  {authKey || '—'}
                </code>
                <button
                  type="button"
                  onClick={copyAuthCode}
                  disabled={!authKey}
                  className="shrink-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </section>

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
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">{t.label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
                    {t.id === 'custom' && (
                      <Link
                        href="/dashboard/control-panel/template-builder"
                        className="inline-block mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open Template Builder →
                      </Link>
                    )}
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
