'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, GripVertical, Settings, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Widget = { id: string; label: string; size: 'compact' | 'normal' | 'wide' }

const LIBRARY = [
  'Fleet KPI Stats',
  'Oil Change Status Bar',
  'Active Alerts Panel',
  'Recent Inspections Feed',
  'Driver Activity Feed',
  'Vehicles Due for Service',
  'Fleet Map Preview',
  'Quick Actions Panel',
  'Announcements Preview',
]

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', label: 'Fleet KPI Stats', size: 'wide' },
  { id: 'w2', label: 'Active Alerts Panel', size: 'normal' },
  { id: 'w3', label: 'Recent Inspections Feed', size: 'normal' },
]

export default function DashboardBuilderPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [hydrated, setHydrated] = useState(false)

  const saveWidgets = useCallback(async (newWidgets: Widget[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const companyId = user.user_metadata?.company_id as string | undefined
    if (!companyId) return
    const existing = (user.user_metadata?.company_settings as Record<string, Record<string, unknown>> | undefined) ?? {}
    const companySettings = (existing[companyId] as Record<string, unknown> | undefined) ?? {}
    await supabase.auth.updateUser({
      data: {
        company_settings: {
          ...existing,
          [companyId]: {
            ...companySettings,
            dashboardWidgets: newWidgets,
          },
        },
      },
    })
  }, [])

  const updateWidgets = useCallback(
    (updater: (prev: Widget[]) => Widget[]) => {
      setWidgets((prev) => {
        const next = updater(prev)
        void saveWidgets(next)
        return next
      })
    },
    [saveWidgets],
  )

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHydrated(true)
        return
      }
      const companyId = user.user_metadata?.company_id as string | undefined
      const settings = user.user_metadata?.company_settings as Record<string, { dashboardWidgets?: Widget[] }> | undefined
      const saved = companyId ? settings?.[companyId]?.dashboardWidgets : undefined
      if (saved?.length) setWidgets(saved)
      setHydrated(true)
    }
    load()
  }, [])

  return (
    <div className="page-fade-in px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Control Panel · Dashboard</p>
        <h1 className="text-2xl font-display font-bold text-white">Dashboard Builder</h1>
        <p className="text-sm text-slate-400 mt-1">Build your home dashboard widget by widget. Layout saves to your account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="card-glass rounded-2xl p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-white mb-3">Widget Library</h2>
          <div className="space-y-2">
            {LIBRARY.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() =>
                  updateWidgets((prev) => [...prev, { id: `${Date.now()}-${w}`, label: w, size: 'normal' }])
                }
                className="w-full text-left px-3 py-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.04] text-sm text-slate-300"
              >
                {w}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">Drag-and-drop coming soon. Use up/down reorder for v1.</p>
        </section>

        <section className="card-glass rounded-2xl p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-3">Canvas</h2>
          {!hydrated ? (
            <p className="text-sm text-slate-500">Loading layout…</p>
          ) : (
            <div className="space-y-2">
              {widgets.map((w, idx) => (
                <div key={w.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 flex items-center gap-2">
                  <GripVertical size={14} className="text-slate-600" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{w.label}</p>
                    <p className="text-xs text-slate-500">Width: {w.size}</p>
                  </div>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      updateWidgets((prev) => {
                        const next = [...prev]
                        ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                        return next
                      })
                    }
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500 disabled:opacity-40"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === widgets.length - 1}
                    onClick={() =>
                      updateWidgets((prev) => {
                        const next = [...prev]
                        ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
                        return next
                      })
                    }
                    className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500 disabled:opacity-40"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-500">
                    <Settings size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWidgets((prev) => prev.filter((x) => x.id !== w.id))}
                    className="p-1.5 rounded-md hover:bg-red-500/[0.12] text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className="btn-primary px-4 py-2 text-sm"
              onClick={() => void saveWidgets(widgets)}
            >
              Save Layout
            </button>
            <Link href="/dashboard/control-panel" className="btn-ghost px-4 py-2 text-sm">
              Back
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
