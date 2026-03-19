'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserDisplayName } from '@/lib/user-utils'
import { Check, ClipboardCheck, Send, X } from 'lucide-react'
import type { Vehicle } from '@/lib/dashboard-types'

export type HomeDriver = {
  id: string
  first_name: string | null
  last_name: string | null
  user_id: string | null
}

export type HomeInspection = {
  id: string
  vehicle_id: string | null
  driver_id: string | null
  type: string
  status: string
  submitted_at: string
}

function territoryFromCode(code: string | null): 'New York' | 'DMV' {
  if (!code) return 'New York'
  return code.toLowerCase().includes('dmv') ? 'DMV' : 'New York'
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function startOfToday(): Date {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

function endOfToday(): Date {
  const t = startOfToday()
  t.setDate(t.getDate() + 1)
  return t
}

export default function DashboardHomeClient({
  companyId,
  initialVehicles,
  initialDrivers,
  initialInspections,
}: {
  companyId: string
  initialVehicles: Vehicle[]
  initialDrivers: HomeDriver[]
  initialInspections: HomeInspection[]
}) {
  const supabase = createClient()
  const [userName, setUserName] = useState('there')
  const [vehicles] = useState(initialVehicles)
  const [drivers] = useState(initialDrivers)
  const [inspections] = useState(initialInspections)
  const [reminderVehicleId, setReminderVehicleId] = useState<string | null>(null)
  const [reminderMsg, setReminderMsg] = useState('')
  const [reminderSent, setReminderSent] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(getUserDisplayName(user))
    })
  }, [supabase])

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers])

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'active' || !v.status),
    [vehicles],
  )

  const oilOverdueCount = useMemo(() => {
    return vehicles.filter((v) => {
      const cur = v.current_mileage ?? 0
      const due = v.oil_change_due_mileage ?? 0
      return due > 0 && cur >= due
    }).length
  }, [vehicles])

  const inspectionsThisWeek = inspections.length

  const pendingToday = useMemo(() => {
    const start = startOfToday()
    const end = endOfToday()
    return activeVehicles.filter((v) => {
      const hasPreToday = inspections.some(
        (i) =>
          i.vehicle_id === v.id &&
          i.type === 'pre_trip' &&
          new Date(i.submitted_at) >= start &&
          new Date(i.submitted_at) < end,
      )
      return !hasPreToday
    })
  }, [activeVehicles, inspections])

  const sevenDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  }, [])

  const inspectionsWeek = useMemo(
    () => inspections.filter((i) => new Date(i.submitted_at) >= sevenDaysAgo),
    [inspections, sevenDaysAgo],
  )

  const nyVehicles = useMemo(() => vehicles.filter((v) => territoryFromCode(v.code) === 'New York'), [vehicles])
  const dmvVehicles = useMemo(() => vehicles.filter((v) => territoryFromCode(v.code) === 'DMV'), [vehicles])

  const accuracy = (territoryList: Vehicle[]) => {
    const ids = new Set(territoryList.map((v) => v.id))
    const inspCount = inspectionsWeek.filter((i) => i.vehicle_id && ids.has(i.vehicle_id)).length
    const n = Math.max(territoryList.length, 1)
    return Math.min(100, Math.round((inspCount / n) * 100))
  }

  const nyPct = accuracy(nyVehicles)
  const dmvPct = accuracy(dmvVehicles)

  const barColor = (p: number) => (p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500')

  const oilAlerts = useMemo(() => {
    return vehicles
      .map((v) => {
        const cur = v.current_mileage ?? 0
        const due = v.oil_change_due_mileage ?? 0
        const overdue = due > 0 && cur >= due ? cur - due : 0
        return { v, overdue }
      })
      .filter((x) => x.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 5)
  }, [vehicles])

  const sendReminder = async (driverUserId: string, vehicleCode: string, driverId: string) => {
    const msg =
      reminderMsg.trim() ||
      `Don't forget your pre-trip inspection today for truck ${vehicleCode}.`
    const res = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        recipient_user_id: driverUserId,
        type: 'announcement',
        title: 'Inspection Reminder',
        body: msg,
      }),
    })
    if (res.ok) {
      setReminderSent(driverId)
      setReminderVehicleId(null)
      setReminderMsg('')
      window.setTimeout(() => setReminderSent(null), 3000)
    }
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto page-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="status-dot active" />
          <span className="text-xs text-slate-500 uppercase tracking-widest">Command center</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Good morning, {userName}</h1>
        <p className="text-sm text-slate-400 mt-1">Inspections, reminders, and fleet pulse at a glance</p>
      </div>

      {/* KPI row — compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total vehicles', value: vehicles.length },
          { label: 'Active', value: activeVehicles.length },
          { label: 'Oil overdue', value: oilOverdueCount },
          { label: 'Inspections this week', value: inspectionsThisWeek },
        ].map((k) => (
          <div key={k.label} className="card-glass rounded-xl p-3 border border-white/[0.06]">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{k.label}</div>
            <div className="text-2xl font-mono font-bold text-white mt-0.5">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending inspections */}
        <div className="card-glass rounded-2xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Pending inspections</h2>
            </div>
            <span className="num-badge bg-blue-500/15 text-blue-300">{pendingToday.length}</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Trucks without a pre-trip logged today</p>
          {pendingToday.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm py-6 justify-center">
              <Check className="w-4 h-4" />
              All inspections complete today
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {pendingToday.map((vehicle) => {
                const dr = vehicle.driver_id ? driverById.get(vehicle.driver_id) : undefined
                const name = dr ? `${dr.first_name ?? ''} ${dr.last_name ?? ''}`.trim() || 'Driver' : 'Unassigned'
                const open = reminderVehicleId === vehicle.id
                return (
                  <div key={vehicle.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <span className="font-mono font-semibold text-white">{vehicle.code || '—'}</span>
                      <span className="text-xs text-slate-400">{name}</span>
                      <button
                        type="button"
                        disabled={!dr?.user_id}
                        onClick={() => {
                          setReminderVehicleId(open ? null : vehicle.id)
                          setReminderMsg('')
                        }}
                        className="btn-ghost text-xs px-2 py-1 rounded-lg disabled:opacity-40"
                      >
                        Send reminder
                      </button>
                    </div>
                    {open && (
                      <div className="mt-2 flex flex-col sm:flex-row gap-2">
                        <input
                          className="input-field text-xs py-1.5 flex-1"
                          value={reminderMsg}
                          onChange={(e) => setReminderMsg(e.target.value)}
                          placeholder={`Don’t forget your inspection for ${vehicle.code ?? 'truck'}...`}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => dr?.user_id && sendReminder(dr.user_id, vehicle.code || '', dr.id)}
                            className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Send
                          </button>
                          <button type="button" onClick={() => setReminderVehicleId(null)} className="btn-ghost text-xs px-2 py-1.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    {reminderSent === dr?.id && (
                      <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Sent
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Accuracy */}
        <div className="card-glass rounded-2xl p-4 border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white mb-3">Inspection accuracy this week</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">New York</div>
              <div className="text-xl font-mono font-bold text-white">{nyPct}%</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${barColor(nyPct)}`} style={{ width: `${nyPct}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">DMV</div>
              <div className="text-xl font-mono font-bold text-white">{dmvPct}%</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${barColor(dmvPct)}`} style={{ width: `${dmvPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Completed this week */}
        <div className="card-glass rounded-2xl p-4 border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white mb-3">Completed inspections this week</h2>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {inspectionsWeek.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No inspections this week yet</p>
            ) : (
              inspectionsWeek.map((row) => {
                const v = vehicles.find((x) => x.id === row.vehicle_id)
                const dr = row.driver_id ? driverById.get(row.driver_id) : undefined
                const dname = dr ? `${dr.first_name ?? ''} ${dr.last_name ?? ''}`.trim() : '—'
                return (
                  <Link
                    key={row.id}
                    href="/dashboard/inspections"
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-blue-500/30 transition-colors"
                  >
                    <span className="text-xs text-slate-300 truncate">{dname}</span>
                    <span className="font-mono text-xs text-white">{v?.code ?? '—'}</span>
                    <span
                      className={`badge text-[10px] ${row.status === 'failed' ? 'badge-danger' : row.status === 'passed' ? 'badge-active' : 'badge-neutral'}`}
                    >
                      {row.status}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatTimeAgo(row.submitted_at)}</span>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card-glass rounded-2xl p-4 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Active alerts</h2>
            <Link href="/dashboard/fleet-health" className="text-xs text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>
          {oilAlerts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No oil overdue vehicles</p>
          ) : (
            <ul className="space-y-2">
              {oilAlerts.map(({ v, overdue }) => (
                <li key={v.id}>
                  <Link
                    href={`/dashboard/vehicles/${v.id}`}
                    className="flex items-center justify-between text-xs py-2 px-2 rounded-lg hover:bg-white/[0.04]"
                  >
                    <span className="font-mono text-white">{v.code}</span>
                    <span className="text-red-400 font-mono">+{overdue.toLocaleString()} mi</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
