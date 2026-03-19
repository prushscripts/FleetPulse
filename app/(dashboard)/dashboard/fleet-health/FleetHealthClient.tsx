'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets,
  AlertCircle,
  ClipboardCheck,
  AlertTriangle,
  ChevronRight,
  Gauge,
  Truck,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LOGIN_LANDING_KEY = 'fleetpulse-login-landing'

type VehicleRow = {
  id: string
  code: string | null
  make: string | null
  model: string | null
  current_mileage: number
  oil_change_due_mileage: number
  status: string | null
  company_id?: string | null
}

type IssueRow = {
  id: string
  vehicle_id: string
  title: string
  status: string
  priority?: string | null
  vehicles?: { code: string | null } | { code: string | null }[] | null
}

function issueVehicleCode(veh: IssueRow['vehicles']): string | null {
  if (veh == null) return null
  return Array.isArray(veh) ? veh[0]?.code ?? null : veh.code
}

type InspectionRow = {
  vehicle_id: string | null
  status: string
  submitted_at: string
}

const DUE_SOON_MILES = 500
const INSPECTION_DAYS = 30

function getVehicleType(vehicle: VehicleRow): 'van' | 'truck' | 'other' {
  const combined = `${vehicle.make || ''} ${vehicle.model || ''}`.toLowerCase()
  if (combined.includes('van') || combined.includes('transit') || combined.includes('cargo')) return 'van'
  if (combined.includes('truck') || combined.includes('f-') || combined.includes('ram')) return 'truck'
  return 'other'
}

function getTerritory(code: string | null): 'New York' | 'DMV' {
  if (!code) return 'New York'
  return code.toLowerCase().includes('dmv') ? 'DMV' : 'New York'
}

export default function FleetHealthClient() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [inspections, setInspections] = useState<InspectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [justLandedFromLogin, setJustLandedFromLogin] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(LOGIN_LANDING_KEY)) {
        sessionStorage.removeItem(LOGIN_LANDING_KEY)
        setJustLandedFromLogin(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const cid = (user?.user_metadata?.company_id as string) || null
        setCompanyId(cid)
        if (!cid) {
          setLoading(false)
          return
        }

        let vehiclesQuery = supabase.from('vehicles').select('id, code, make, model, current_mileage, oil_change_due_mileage, status, company_id').order('code')
        vehiclesQuery = vehiclesQuery.eq('company_id', cid)
        const { data: vehiclesData, error: veErr } = await vehiclesQuery
        if (veErr) throw veErr

        const vehicleIds = (vehiclesData || []).map((v) => v.id)
        setVehicles((vehiclesData as VehicleRow[]) || [])

        const { data: issuesData, error: issErr } = await supabase
          .from('issues')
          .select('id, vehicle_id, title, status, priority, vehicles(code)')
          .neq('status', 'resolved')
        if (issErr) throw issErr
        const issuesFiltered = (issuesData || []).filter((i: IssueRow) => vehicleIds.includes(i.vehicle_id))
        setIssues(issuesFiltered)

        const since = new Date()
        since.setDate(since.getDate() - INSPECTION_DAYS)
        const sinceStr = since.toISOString().slice(0, 10)

        const { data: inspData, error: inspErr } = await supabase
          .from('inspections')
          .select('vehicle_id, status, submitted_at')
          .eq('company_id', cid)
          .gte('submitted_at', sinceStr)
        if (inspErr) throw inspErr
        setInspections((inspData as InspectionRow[]) || [])
      } catch (e) {
        console.error('FleetHealth load error', e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [supabase])

  const {
    totalCount,
    overdueCount,
    dueSoonCount,
    oilOkCount,
    totalOpenIssues,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    vehiclesNoIssues,
    inspectionPassRate,
    passedCount,
    failedCount,
    healthScore,
    scoreLabel,
    scoreColor,
    attentionVehicles,
    highMileageVehicles,
    vanCount,
    truckCount,
    otherCount,
    nyCount,
    dmvCount,
    activeCount,
  } = useMemo(() => {
    const total = vehicles.length
    if (total === 0) {
      return {
        totalCount: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        oilOkCount: 0,
        totalOpenIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        vehiclesNoIssues: 0,
        inspectionPassRate: 0,
        passedCount: 0,
        failedCount: 0,
        healthScore: 0,
        scoreLabel: 'No data',
        scoreColor: 'bg-slate-500/10 text-slate-400',
        attentionVehicles: [] as {
          id: string
          truckNumber: string
          oilOverdueMiles: number
          openIssues: number
          hasFailed: boolean
        }[],
        highMileageVehicles: [] as { id: string; truckNumber: string; mileage: number }[],
        vanCount: 0,
        truckCount: 0,
        otherCount: 0,
        nyCount: 0,
        dmvCount: 0,
        activeCount: 0,
      }
    }

    const active = vehicles.filter((v) => v.status === 'active' || !v.status)
    const activeCountNum = active.length

    let oilOk = 0
    let dueSoon = 0
    let overdue = 0
    vehicles.forEach((v) => {
      const cur = v.current_mileage ?? 0
      const due = v.oil_change_due_mileage ?? 0
      const until = due - cur
      if (due > 0 && cur >= due) overdue++
      else if (until <= DUE_SOON_MILES && until > 0) dueSoon++
      else oilOk++
    })

    const vehicleIdSet = new Set(vehicles.map((v) => v.id))
    const issuesForFleet = issues.filter((i) => vehicleIdSet.has(i.vehicle_id))
    const totalOpenIssuesNum = issuesForFleet.length
    const criticalIssuesNum = issuesForFleet.filter((i) => i.priority === 'critical').length
    const highIssuesNum = issuesForFleet.filter((i) => i.priority === 'high').length
    const mediumIssuesNum = issuesForFleet.filter((i) => i.priority === 'medium').length
    const lowIssuesNum = issuesForFleet.filter((i) => i.priority === 'low' || !i.priority).length

    const issuesByVehicle = new Map<string, number>()
    issuesForFleet.forEach((i) => {
      issuesByVehicle.set(i.vehicle_id, (issuesByVehicle.get(i.vehicle_id) || 0) + 1)
    })
    const vehiclesNoIssuesNum = vehicles.filter((v) => !issuesByVehicle.get(v.id)).length

    const inspInPeriod = inspections.filter((i) => i.vehicle_id && vehicleIdSet.has(i.vehicle_id))
    const passed = inspInPeriod.filter((i) => i.status === 'passed').length
    const failed = inspInPeriod.filter((i) => i.status === 'failed').length
    const totalInsp = passed + failed
    const inspectionPassRateNum = totalInsp > 0 ? Math.round((passed / totalInsp) * 100) : 0

    const failedRate = totalInsp > 0 ? (failed / totalInsp) * 30 : 0
    const healthScoreNum = Math.round(
      Math.max(
        0,
        100 -
          (overdue / total) * 40 -
          (totalOpenIssuesNum / total) * 30 -
          failedRate
      )
    )
    const score = Math.min(100, healthScoreNum)

    let scoreLabel = 'Critical'
    let scoreColor = 'bg-red-500/10 text-red-400'
    if (score >= 80) {
      scoreLabel = 'Excellent'
      scoreColor = 'bg-emerald-500/10 text-emerald-400'
    } else if (score >= 60) {
      scoreLabel = 'Good'
      scoreColor = 'bg-blue-500/10 text-blue-400'
    } else if (score >= 40) {
      scoreLabel = 'Needs Attention'
      scoreColor = 'bg-amber-500/10 text-amber-400'
    }

    const attentionList = vehicles.map((v) => {
      const cur = v.current_mileage ?? 0
      const due = v.oil_change_due_mileage ?? 0
      const oilOverdueMiles = due > 0 && cur >= due ? cur - due : 0
      const openIssues = issuesByVehicle.get(v.id) || 0
      const hasFailed = inspInPeriod.some((i) => i.vehicle_id === v.id && i.status === 'failed')
      return {
        id: v.id,
        truckNumber: v.code || '—',
        oilOverdueMiles,
        openIssues,
        hasFailed,
      }
    })
    attentionList.sort((a, b) => {
      if (b.oilOverdueMiles !== a.oilOverdueMiles) return b.oilOverdueMiles - a.oilOverdueMiles
      if (b.openIssues !== a.openIssues) return b.openIssues - a.openIssues
      return (b.hasFailed ? 1 : 0) - (a.hasFailed ? 1 : 0)
    })

    const attentionFiltered = attentionList.filter(
      (a) => a.oilOverdueMiles > 0 || a.openIssues > 0 || a.hasFailed
    )

    const highMileage = vehicles
      .map((v) => ({
        id: v.id,
        truckNumber: v.code || '—',
        mileage: v.current_mileage ?? 0,
      }))
      .sort((a, b) => b.mileage - a.mileage)

    let van = 0
    let truck = 0
    let other = 0
    let ny = 0
    let dmv = 0
    vehicles.forEach((v) => {
      const t = getVehicleType(v)
      if (t === 'van') van++
      else if (t === 'truck') truck++
      else other++
      const loc = getTerritory(v.code)
      if (loc === 'New York') ny++
      else dmv++
    })

    return {
      totalCount: total,
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      oilOkCount: oilOk,
      totalOpenIssues: totalOpenIssuesNum,
      criticalIssues: criticalIssuesNum,
      highIssues: highIssuesNum,
      mediumIssues: mediumIssuesNum,
      lowIssues: lowIssuesNum,
      vehiclesNoIssues: vehiclesNoIssuesNum,
      inspectionPassRate: inspectionPassRateNum,
      passedCount: passed,
      failedCount: failed,
      healthScore: score,
      scoreLabel,
      scoreColor,
      attentionVehicles: attentionFiltered,
      highMileageVehicles: highMileage,
      vanCount: van,
      truckCount: truck,
      otherCount: other,
      nyCount: ny,
      dmvCount: dmv,
      activeCount: activeCountNum,
    }
  }, [vehicles, issues, inspections])

  if (loading) {
    return (
      <div className="page-fade-in px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="skeleton h-4 w-32 rounded mb-2" />
          <div className="skeleton h-9 w-64 rounded mb-1" />
          <div className="skeleton h-4 w-48 rounded" />
        </div>
        <div className="card-glass rounded-2xl p-6 md:p-8 mb-6">
          <div className="skeleton h-20 w-24 rounded mb-4" />
          <div className="skeleton h-4 w-full rounded mb-2" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-glass rounded-2xl p-5">
              <div className="skeleton h-5 w-32 rounded mb-4" />
              <div className="space-y-2.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="skeleton h-4 w-full rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card-glass rounded-2xl overflow-hidden mb-6">
          <div className="skeleton h-12 w-full rounded" />
          <div className="divide-y divide-white/[0.04]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const oilCompliancePct = activeCount > 0 ? Math.round(((activeCount - overdueCount) / activeCount) * 100) : 0
  const issueFreePct = totalCount > 0 ? Math.round((vehiclesNoIssues / totalCount) * 100) : 0

  const content = (
    <div className="page-fade-in px-4 md:px-6 py-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="status-dot active" />
          <span className="text-xs text-slate-500 uppercase tracking-widest">
            Fleet health · Live
          </span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white">
          Fleet Health Overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time health status across all {totalCount} vehicles
        </p>
      </div>

      <div className="card-glass rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)' }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Overall Fleet Health Score
            </div>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-mono font-bold text-white">
                {healthScore}
              </span>
              <span className="text-2xl text-slate-500 mb-2">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${scoreColor}`}>{scoreLabel}</span>
              <span className="text-xs text-slate-500">
                Based on oil status, open issues, and inspections
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 min-w-[240px]">
            {[
              { label: 'Oil compliance', value: oilCompliancePct, color: 'bg-emerald-500' },
              { label: 'Issue-free vehicles', value: issueFreePct, color: 'bg-blue-500' },
              { label: 'Inspection pass rate', value: inspectionPassRate, color: 'bg-violet-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-mono text-white">{value}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-1000`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Droplets size={14} className="text-amber-400" />
              Oil Change Status
            </h3>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Oil OK', count: oilOkCount, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
              { label: 'Due soon (within 500mi)', count: dueSoonCount, color: 'bg-amber-500', textColor: 'text-amber-400' },
              { label: 'Overdue', count: overdueCount, color: 'bg-red-500', textColor: 'text-red-400' },
            ].map(({ label, count, color, textColor }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${totalCount > 0 ? (count / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-semibold ${textColor} w-6 text-right`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <Link
              href="/dashboard/vehicles?filter=oil_overdue"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View overdue vehicles →
            </Link>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setIssuesOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIssuesOpen(true)
            }
          }}
          className="card-glass rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-colors border border-transparent"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-400" />
              Open Issues
            </h3>
            <span className="num-badge bg-rose-500/10 text-rose-400">
              {totalOpenIssues}
            </span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Critical', count: criticalIssues, color: 'bg-red-500', textColor: 'text-red-400' },
              { label: 'High', count: highIssues, color: 'bg-orange-500', textColor: 'text-orange-400' },
              { label: 'Medium', count: mediumIssues, color: 'bg-amber-500', textColor: 'text-amber-400' },
              { label: 'Low', count: lowIssues, color: 'bg-blue-500', textColor: 'text-blue-400' },
            ].map(({ label, count, color, textColor }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <span className={`text-xs font-mono font-semibold ${textColor}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ClipboardCheck size={14} className="text-blue-400" />
              Inspection Health
            </h3>
          </div>
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="text-4xl font-mono font-bold text-white">
                {inspectionPassRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">pass rate (30 days)</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/[0.06] rounded-xl p-3 text-center">
                <div className="text-lg font-mono font-bold text-emerald-400">{passedCount}</div>
                <div className="text-[10px] text-slate-500">Passed</div>
              </div>
              <div className="bg-red-500/[0.06] rounded-xl p-3 text-center">
                <div className="text-lg font-mono font-bold text-red-400">{failedCount}</div>
                <div className="text-[10px] text-slate-500">Failed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            Vehicles needing attention
          </h2>
          <Link href="/dashboard/vehicles" className="text-xs text-blue-400 hover:text-blue-300">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {attentionVehicles.slice(0, 8).map((v) => (
            <Link
              href={`/dashboard/vehicles/${v.id}`}
              key={v.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 group"
            >
              <div
                className={`w-1 h-10 rounded-full flex-shrink-0 ${
                  v.oilOverdueMiles > 100000
                    ? 'bg-red-500'
                    : v.oilOverdueMiles > 50000
                      ? 'bg-amber-500'
                      : 'bg-amber-400'
                }`}
              />

              <div className="w-16 flex-shrink-0">
                <span className="text-sm font-mono font-bold text-white">{v.truckNumber}</span>
              </div>

              <div className="flex-1 min-w-0">
                {v.oilOverdueMiles > 0 ? (
                  <>
                    <p className="text-xs text-slate-400">Oil overdue by</p>
                    <p className="text-sm font-mono font-semibold text-red-400">+{v.oilOverdueMiles.toLocaleString()} mi</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Oil — on track</p>
                )}
              </div>

              {v.openIssues > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle size={10} className="text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    {v.openIssues} issue{v.openIssues > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {v.hasFailed && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-xs text-red-400 font-medium">Failed insp.</span>
                </div>
              )}

              <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge size={14} className="text-violet-400" />
            High mileage vehicles
          </h3>
          <div className="space-y-3">
            {highMileageVehicles.slice(0, 5).map((v, i) => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                <span className="font-mono text-xs text-white w-16">{v.truckNumber}</span>
                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500/60 rounded-full"
                    style={{
                      width: `${
                        highMileageVehicles[0]?.mileage
                          ? (v.mileage / highMileageVehicles[0].mileage) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400 w-20 text-right">
                  {v.mileage.toLocaleString()} mi
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Truck size={14} className="text-blue-400" />
            Fleet composition
          </h3>
          <div className="space-y-3">
            {[
              { type: 'Van', count: vanCount, color: 'bg-blue-500' },
              { type: 'Truck', count: truckCount, color: 'bg-violet-500' },
              { type: 'Other', count: otherCount, color: 'bg-slate-500' },
            ].map(({ type, count, color }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">{type}</span>
                <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${totalCount > 0 ? (count / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2">
            <div className="bg-blue-500/[0.06] rounded-xl p-3 text-center">
              <div className="text-lg font-mono font-bold text-blue-400">{nyCount}</div>
              <div className="text-[10px] text-slate-500">New York</div>
            </div>
            <div className="bg-violet-500/[0.06] rounded-xl p-3 text-center">
              <div className="text-lg font-mono font-bold text-violet-400">{dmvCount}</div>
              <div className="text-[10px] text-slate-500">DMV</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {issuesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIssuesOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0F1629] border-l border-white/[0.08] shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-display font-bold text-white">Open Issues</h2>
                  <button
                    type="button"
                    onClick={() => setIssuesOpen(false)}
                    className="p-2 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
                  const priorityIssues = issues.filter((i) => {
                    if (i.status === 'resolved') return false
                    const p = (i.priority || 'low').toLowerCase()
                    if (priority === 'low') return p === 'low' || !i.priority
                    return p === priority
                  })
                  if (!priorityIssues.length) return null
                  return (
                    <div key={priority} className="mb-6">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">{priority}</div>
                      <div className="space-y-2">
                        {priorityIssues.map((issue) => (
                          <Link
                            key={issue.id}
                            href={`/dashboard/vehicles/${issue.vehicle_id}`}
                            onClick={() => setIssuesOpen(false)}
                            className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/[0.04] transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-mono font-semibold text-white">
                                {issueVehicleCode(issue.vehicles) ?? '—'}
                              </span>
                              <span
                                className={`badge ${
                                  priority === 'critical'
                                    ? 'badge-danger'
                                    : priority === 'high'
                                      ? 'badge-warning'
                                      : 'badge-active'
                                }`}
                              >
                                {priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate">{issue.title}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {issues.filter((i) => i.status !== 'resolved').length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">No open issues</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )

  if (justLandedFromLogin) {
    return (
      <motion.div
        initial={{ scale: 1.08, opacity: 0.92 }}
        animate={{ scale: [1.08, 1.02, 1], opacity: 1 }}
        transition={{
          duration: 0.55,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
        }}
        className="min-h-full origin-center"
      >
        {content}
      </motion.div>
    )
  }

  return content
}
