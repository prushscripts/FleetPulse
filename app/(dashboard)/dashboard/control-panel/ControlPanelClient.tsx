'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Copy, Check } from 'lucide-react'
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
] as const

type CompanyConfig = {
  auth_key?: string
  manager_access_code?: string | null
  driver_access_code?: string | null
  enabled_tabs?: string[]
  custom_tab_labels?: Record<string, string>
  inspections_enabled?: boolean
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
  const [managerCode, setManagerCode] = useState<string>(initialCompanyConfig?.manager_access_code ?? '')
  const [driverCode, setDriverCode] = useState<string>(initialCompanyConfig?.driver_access_code ?? '')
  const [importResult, setImportResult] = useState<{ success: number; error: number; message?: string } | null>(null)
  const [copyToast, setCopyToast] = useState(false)
  const [canRegenerateCodes, setCanRegenerateCodes] = useState(false)
  const [requirePreTrip, setRequirePreTrip] = useState(false)
  const [requirePostTrip, setRequirePostTrip] = useState(false)
  const [randomCheckins, setRandomCheckins] = useState(false)
  const [checkinFrequency, setCheckinFrequency] = useState<'daily' | 'every_3_days' | 'weekly'>('daily')
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

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const tier = (user?.user_metadata?.subscription_tier as string | undefined) || 'professional'
      setCanRegenerateCodes(tier === 'premium')
      if (!companyId) return
      const res = await fetch(`/api/company-config?company_id=${encodeURIComponent(companyId)}`)
      if (!res.ok) return
      const cfg = await res.json()
      setManagerCode(cfg?.manager_access_code ?? '')
      setDriverCode(cfg?.driver_access_code ?? '')
    }
    run()
  }, [supabase, companyId])

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

  const copyCode = (value: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
  }

  const generateRandomCode = () => {
    const bytes = new Uint8Array(10)
    crypto.getRandomValues(bytes)
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return `FP-${token.slice(0, 12)}`
  }

  const regenerate = async (kind: 'manager' | 'driver') => {
    if (!companyId) return
    if (!canRegenerateCodes) return
    const ok = window.confirm(
      'This will invalidate the old code. Anyone using the old code will not be able to sign up. Existing accounts are not affected.',
    )
    if (!ok) return
    const next = generateRandomCode()
    const res = await fetch('/api/update-company-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        ...(kind === 'manager' ? { manager_access_code: next } : { driver_access_code: next }),
      }),
    })
    if (!res.ok) return
    if (kind === 'manager') setManagerCode(next)
    else setDriverCode(next)
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
      <div className="min-h-screen bg-[#0A0F1E] text-white">
        <div className="px-4 sm:px-6 max-w-2xl mx-auto py-12">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Settings · Control Panel</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Control Panel</h1>
          <p className="text-slate-400 text-sm mb-6">
            Add or activate a company in Settings to customize your fleet view, templates, and features.
          </p>
          <Link href="/dashboard/settings" className="btn-primary inline-flex items-center gap-2 px-4 py-2 min-h-[44px]">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      {copyToast && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl toast-enter flex items-center gap-2">
          <Check size={14} />
          Copied to clipboard
        </div>
      )}
      <div className="px-4 md:px-6 py-6 page-enter max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Settings · Control Panel</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Control Panel</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Customize your fleet dashboard: template, features, and home segments.
          </p>
        </div>

        {trialDaysLeft !== null && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-medium text-amber-400">
              Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left. Limit: 5 trucks. Upgrade to keep full access.
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <aside className="card-glass rounded-2xl p-3 h-fit lg:sticky lg:top-20">
            <nav className="space-y-1">
              <a href="#general" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">General</a>
              <a href="#appearance" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">Appearance</a>
              <a href="#navigation" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">Navigation</a>
              <Link href="/dashboard/control-panel/dashboard-builder" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">Dashboard</Link>
              <a href="#inspections" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">Inspections</a>
              <Link href="/dashboard/control-panel/templates" className="block px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05]">Templates</Link>
            </nav>
          </aside>

          <form onSubmit={handleSave} className="space-y-4 lg:col-span-3">
          <section id="general" className="card-glass rounded-2xl overflow-hidden mb-4">
            <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Company Configuration</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tab visibility, custom labels, and import.</p>
            </div>
            <div className="px-5 sm:px-6 py-5 space-y-6">
              <p className="text-sm text-slate-400">
                Configure your company&apos;s FleetPulse experience. Tabs and labels apply to the navbar for all members.
              </p>
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Tab visibility</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TAB_KEYS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabledTabs.includes(key)}
                        onChange={() => toggleTab(key)}
                        className="rounded border-white/20 text-blue-500 focus:ring-blue-500/50 bg-white/[0.04]"
                      />
                      <span className="text-sm font-medium text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Custom tab labels</h3>
                <p className="text-xs text-slate-500 mb-2">Rename tabs (e.g. Vehicles → Trucks). Leave blank to use default.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TAB_KEYS.filter((t) => enabledTabs.includes(t.key)).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 w-24 shrink-0">{label}</span>
                      <input
                        type="text"
                        value={customTabLabels[key] ?? ''}
                        onChange={(e) => setCustomLabel(key, e.target.value)}
                        placeholder={label}
                        className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[44px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={inspectionsEnabled}
                  onClick={() => setInspectionsEnabled(!inspectionsEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${inspectionsEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${inspectionsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <div>
                  <span className="font-medium text-white">Enable Digital Inspections</span>
                  <p className="text-xs text-slate-400 mt-0.5">When off, the Inspections tab is removed from the navbar.</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Import data</h3>
                <p className="text-xs text-slate-500 mb-3">Upload CSV files. Columns are mapped by header name (see tooltips).</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => triggerCsvImport('vehicles')}
                    className="px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all min-h-[44px]"
                    title={vehicleColumns.join(', ')}
                  >
                    Import Vehicles (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerCsvImport('drivers')}
                    className="px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all min-h-[44px]"
                    title={driverColumns.join(', ')}
                  >
                    Import Drivers (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerCsvImport('service_records')}
                    className="px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-slate-400 opacity-75 min-h-[44px]"
                    title="Coming soon"
                  >
                    Import Service Records (CSV)
                  </button>
                </div>
                {importResult && (
                  <p className="mt-2 text-xs text-slate-500">
                    {importResult.success} succeeded, {importResult.error} failed.
                    {importResult.message && ` ${importResult.message}`}
                  </p>
                )}
              </div>
              <div>
                <section className="card-glass rounded-2xl overflow-hidden mb-4">
                  <div className="px-5 py-4 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-white">Access Codes</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Share these codes with your team members during signup. Keep them secure.
                    </p>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                        Manager Access Code
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl font-mono text-sm text-white">
                          {managerCode || '—'}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCode(managerCode)}
                          disabled={!managerCode}
                          className="btn-ghost text-xs px-3 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => regenerate('manager')}
                          disabled={!canRegenerateCodes}
                          title={canRegenerateCodes ? 'Regenerate code' : 'Available on Premium plan'}
                          className="btn-ghost text-xs px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                        Driver Access Code
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl font-mono text-sm text-white">
                          {driverCode || '—'}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyCode(driverCode)}
                          disabled={!driverCode}
                          className="btn-ghost text-xs px-3 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => regenerate('driver')}
                          disabled={!canRegenerateCodes}
                          title={canRegenerateCodes ? 'Regenerate code' : 'Available on Premium plan'}
                          className="btn-ghost text-xs px-3 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>

          <section id="appearance" className="card-glass rounded-2xl overflow-hidden mb-4">
            <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Template</h2>
              <p className="text-xs text-slate-400 mt-0.5">Choose dashboard layout.</p>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <p className="text-sm text-slate-400 mb-4">
                Choose a layout style for your dashboard. More templates (and CSV import) coming soon.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map((t) => {
                  const selected = template === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`relative text-left p-4 rounded-xl border transition-all duration-200 min-h-[44px] ${
                        selected ? 'border-blue-500/50 bg-blue-500/5' : 'card-glass border-white/[0.08] hover:bg-white/[0.04]'
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </span>
                      )}
                      <span className="font-medium text-white">{t.label}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                      {t.id === 'custom' && (
                        <Link
                          href="/dashboard/control-panel/template-builder"
                          className="inline-block mt-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open Template Builder →
                        </Link>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section id="inspections" className="card-glass rounded-2xl overflow-hidden mb-4">
            <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Features</h2>
              <p className="text-xs text-slate-400 mt-0.5">Inspections.</p>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={inspectionsEnabled}
                  onClick={() => setInspectionsEnabled(!inspectionsEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${inspectionsEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${inspectionsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <div>
                  <span className="font-medium text-white">Inspection system</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Show Inspections tab and inspection tracking. Turn off if you don’t use inspections.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card-glass rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Inspection Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure how inspections work for your fleet</p>
            </div>
            <div className="px-5 py-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white">Enable inspection system</p>
                  <p className="text-xs text-slate-500">Show inspections tab and allow drivers to submit reports</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inspectionsEnabled}
                  onClick={() => setInspectionsEnabled(!inspectionsEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${inspectionsEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${inspectionsEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300">Require pre-trip inspection</p>
                <input type="checkbox" checked={requirePreTrip} onChange={(e) => setRequirePreTrip(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300">Require post-trip inspection</p>
                <input type="checkbox" checked={requirePostTrip} onChange={(e) => setRequirePostTrip(e.target.checked)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Random driver check-ins</p>
                  <input type="checkbox" checked={randomCheckins} onChange={(e) => setRandomCheckins(e.target.checked)} />
                </div>
                {randomCheckins && (
                  <div className="ml-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <label className="text-xs text-slate-500 mb-1.5 block">Check-in frequency</label>
                    <select className="input-field text-sm" value={checkinFrequency} onChange={(e) => setCheckinFrequency(e.target.value as any)}>
                      <option value="daily">Daily</option>
                      <option value="every_3_days">Every 3 days</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card-glass rounded-2xl overflow-hidden mb-4">
            <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Home dashboard segments</h2>
              <p className="text-xs text-slate-400 mt-0.5">Territory segments for home view.</p>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <p className="text-sm text-slate-400 mb-3">
                Optional labels for territory/region tabs on the home page (e.g. New York, DMV). Comma-separated. Leave blank for “Full fleet” only.
              </p>
              <input
                type="text"
                value={territoryInput}
                onChange={(e) => setTerritoryInput(e.target.value)}
                placeholder="e.g. New York, DMV, West"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[44px]"
              />
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary min-h-[44px] w-full sm:w-auto disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
