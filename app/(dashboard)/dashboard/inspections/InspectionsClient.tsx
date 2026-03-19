'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Search, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import EmptyState from '@/components/ui/EmptyState'

type Inspection = {
  id: string
  vehicle_id: string | null
  type: 'pre_trip' | 'post_trip' | 'custom'
  status: 'passed' | 'failed' | 'needs_review' | 'pending'
  submitted_at: string
  odometer: number | null
  vehicles?: Array<{ code: string | null; location?: string | null }> | null
}

export default function InspectionsClient() {
  const [activeTab, setActiveTab] = useState<'reports' | 'templates'>('reports')
  const [rows, setRows] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'pre_trip' | 'post_trip' | 'failed'>('all')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const cid = (user?.user_metadata?.company_id as string) || null
        setCompanyId(cid)
        if (!cid) {
          setRows([])
          setLoading(false)
          return
        }
        const { data } = await supabase
          .from('inspections')
          .select('id, vehicle_id, type, status, submitted_at, odometer, vehicles(code, location)')
          .eq('company_id', cid)
          .order('submitted_at', { ascending: false })
        setRows((data as unknown as Inspection[]) || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [supabase])

  const getVehicleCode = (v: Inspection['vehicles']) =>
    Array.isArray(v) ? v[0]?.code : undefined

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'pre_trip' && r.type !== 'pre_trip') return false
      if (filter === 'post_trip' && r.type !== 'post_trip') return false
      if (filter === 'failed' && r.status !== 'failed') return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return `${getVehicleCode(r.vehicles) || r.vehicle_id || ''} ${r.type} ${r.status}`.toLowerCase().includes(q)
    })
  }, [rows, filter, query])

  const kpi = {
    total: rows.length,
    passed: rows.filter((r) => r.status === 'passed').length,
    failed: rows.filter((r) => r.status === 'failed').length,
    pending: rows.filter((r) => r.status === 'needs_review' || r.status === 'pending').length,
  }

  return (
    <div className="page-fade-in px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
        <span>Fleet</span>
        <ChevronRight size={12} />
        <span className="text-slate-400">Inspections</span>
      </div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Inspections</h1>
          <p className="text-sm text-slate-500 mt-1">Review reports and manage templates</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total', value: kpi.total, color: 'text-white', bg: 'bg-white/[0.04]' },
          { label: 'Passed', value: kpi.passed, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]' },
          { label: 'Failed', value: kpi.failed, color: 'text-red-400', bg: 'bg-red-500/[0.06]' },
          { label: 'Pending', value: kpi.pending, color: 'text-amber-400', bg: 'bg-amber-500/[0.06]' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl px-3 py-2.5 text-center`}>
            <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06] w-fit mb-4">
        <button onClick={() => setActiveTab('reports')} className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'reports' ? 'bg-white/[0.12] text-white' : 'text-slate-500'}`}>Inspection Reports</button>
        <button onClick={() => setActiveTab('templates')} className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'templates' ? 'bg-white/[0.12] text-white' : 'text-slate-500'}`}>Templates</button>
      </div>

      {activeTab === 'reports' ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input-field pl-9 pr-8 h-9 text-sm" placeholder="Search inspections..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {(['all', 'pre_trip', 'post_trip', 'failed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${filter === tab ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'text-slate-500'}`}
                >
                  {tab === 'all' ? 'All' : tab === 'pre_trip' ? 'Pre-Trip' : tab === 'post_trip' ? 'Post-Trip' : 'Failed'}
                </button>
              ))}
            </div>
          </div>

          <div className="card-glass rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 w-full" />
                ))}
              </div>
            ) : !companyId ? (
              <EmptyState icon={ClipboardCheck} title="No company selected" description="Select or activate a company in Settings to view inspections." />
            ) : filtered.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No inspections yet" description="Completed inspection reports will appear here." />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((r) => (
                  <Link href={`/dashboard/inspections/${r.id}`} key={r.id} className={`group flex items-center justify-between gap-3 px-4 py-3 border-l-2 ${
                    r.status === 'passed' ? 'border-l-emerald-500/60' : r.status === 'failed' ? 'border-l-red-500/60' : 'border-l-amber-500/60'
                  } hover:bg-white/[0.03] transition-colors`}>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-mono">
                        {getVehicleCode(r.vehicles) ?? (r.vehicle_id ? `${r.vehicle_id.slice(0, 8)}…` : '—')}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {r.type === 'pre_trip' ? 'Pre-Trip' : r.type === 'post_trip' ? 'Post-Trip' : 'Custom'} · {new Date(r.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{(r.odometer ?? 0).toLocaleString()} mi</span>
                      <span className={`badge ${
                        r.status === 'passed' ? 'badge-active' : r.status === 'failed' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {r.status === 'needs_review' ? 'Needs Review' : r.status}
                      </span>
                      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View Report →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Standard Pre-Trip', type: 'pre_trip' },
            { name: 'Standard Post-Trip', type: 'post_trip' },
          ].map((t) => (
            <div key={t.name} className="card-glass rounded-2xl p-4">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-slate-500 mt-1">{t.type}</p>
              <div className="flex gap-2 mt-4">
                <Link href={`/dashboard/inspections/templates/${t.type}`} className="btn-ghost px-3 py-2 text-xs">Edit</Link>
                <button className="btn-ghost px-3 py-2 text-xs">Duplicate</button>
                <button className="btn-primary px-3 py-2 text-xs">Set as Default</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

