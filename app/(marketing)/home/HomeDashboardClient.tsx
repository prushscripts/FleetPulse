'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { CustomTemplate } from '@/lib/custom-template'

type TerritoryFilterValue = 'all' | (string & {})

interface FleetStats {
  totalVehicles: number
  activeVehicles: number
  outOfServiceVehicles: number
  inShopVehicles: number
  vehiclesOverdueOil: number
  vehiclesDueSoonOil: number
  vehiclesOkOil: number
  totalOpenIssues: number
  criticalIssues: number
  expiredDocuments: number
  totalInspections: number
  passedInspections: number
  failedInspections: number
  pendingInspections: number
}

interface VehicleRow {
  id: string
  code?: string | null
  status?: string | null
  current_mileage?: number | null
  oil_change_due_mileage?: number | null
}

export default function HomeDashboardClient({
  territoryMap = {},
  companyId,
  companyName = null,
  territorySegmentLabels = [],
  template = 'default',
  customTemplate = null,
}: {
  territoryMap?: Record<string, string>
  companyId?: string | null
  companyName?: string | null
  territorySegmentLabels?: string[]
  template?: string
  customTemplate?: CustomTemplate | null
}) {
  const isCompact = template === 'compact'
  const isExecutive = template === 'executive'
  const isCustom = template === 'custom' && customTemplate != null
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [issues, setIssues] = useState<Array<{ vehicle_id: string; status: string; priority?: string }>>([])
  const [documents, setDocuments] = useState<Array<{ vehicle_id: string; expiration_date: string | null }>>([])
  const [inspections, setInspections] = useState<Array<{ vehicle_id: string; status: string }>>([])
  const [territoryFilter, setTerritoryFilter] = useState<TerritoryFilterValue>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const getTerritory = (vehicle: VehicleRow): string => {
    const code = vehicle.code?.toLowerCase()
    if (!code) return 'Other'
    return territoryMap[code] ?? 'Other'
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      let vehiclesQuery = supabase.from('vehicles').select('id, code, status, current_mileage, oil_change_due_mileage')
      if (companyId) vehiclesQuery = vehiclesQuery.eq('company_id', companyId)
      const [
        { data: vehiclesData },
        { data: issuesData },
        { data: documentsData },
        { data: inspectionsData },
      ] = await Promise.all([
        vehiclesQuery,
        supabase.from('issues').select('vehicle_id, status, priority').neq('status', 'resolved'),
        supabase.from('documents').select('vehicle_id, expiration_date'),
        supabase.from('inspections').select('vehicle_id, status'),
      ])
      const vehicleIds = new Set((vehiclesData || []).map((v) => v.id))
      setVehicles(vehiclesData || [])
      setIssues((issuesData || []).filter((i) => vehicleIds.has(i.vehicle_id)))
      setDocuments((documentsData || []).filter((d) => vehicleIds.has(d.vehicle_id)))
      setInspections((inspectionsData || []).filter((i) => vehicleIds.has(i.vehicle_id)))
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo((): FleetStats | null => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let vehicleList = vehicles
    if (territoryFilter !== 'all') {
      vehicleList = vehicles.filter((v) => getTerritory(v) === territoryFilter)
    }
    const vehicleIds = new Set(vehicleList.map((v) => v.id))

    const issueList = issues.filter((i) => vehicleIds.has(i.vehicle_id))
    const documentList = documents.filter((d) => vehicleIds.has(d.vehicle_id))
    const inspectionList = inspections.filter((i) => vehicleIds.has(i.vehicle_id))

    const totalVehicles = vehicleList.length
    const activeVehicles = vehicleList.filter((v) => v.status === 'active' || !v.status).length
    const outOfServiceVehicles = vehicleList.filter((v) => v.status === 'out_of_service').length
    const inShopVehicles = vehicleList.filter((v) => v.status === 'in_shop').length

    let vehiclesOverdueOil = 0
    let vehiclesDueSoonOil = 0
    let vehiclesOkOil = 0
    vehicleList.forEach((vehicle) => {
      const currentMileage = vehicle.current_mileage || 0
      const oilDueMileage = vehicle.oil_change_due_mileage || 0
      const milesUntilDue = oilDueMileage - currentMileage
      if (currentMileage >= oilDueMileage) vehiclesOverdueOil++
      else if (milesUntilDue <= 1000) vehiclesDueSoonOil++
      else vehiclesOkOil++
    })

    const totalOpenIssues = issueList.length
    const criticalIssues = issueList.filter((i) => i.priority === 'critical').length
    const expiredDocuments = documentList.filter(
      (doc) => doc.expiration_date && new Date(doc.expiration_date) < today
    ).length
    const totalInspections = inspectionList.length
    const passedInspections = inspectionList.filter((i) => i.status === 'passed').length
    const failedInspections = inspectionList.filter((i) => i.status === 'failed').length
    const pendingInspections = inspectionList.filter((i) => i.status === 'pending').length

    return {
      totalVehicles,
      activeVehicles,
      outOfServiceVehicles,
      inShopVehicles,
      vehiclesOverdueOil,
      vehiclesDueSoonOil,
      vehiclesOkOil,
      totalOpenIssues,
      criticalIssues,
      expiredDocuments,
      totalInspections,
      passedInspections,
      failedInspections,
      pendingInspections,
    }
  }, [vehicles, issues, documents, inspections, territoryFilter, territoryMap])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading fleet statistics...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Error loading statistics</div>
      </div>
    )
  }

  const oilChangePercentage = stats.totalVehicles > 0
    ? Math.round(((stats.vehiclesOkOil + stats.vehiclesDueSoonOil) / stats.totalVehicles) * 100)
    : 0

  const inspectionPassRate = stats.totalInspections > 0
    ? Math.round((stats.passedInspections / stats.totalInspections) * 100)
    : 0

  const territoryTabs: { value: TerritoryFilterValue; label: string }[] = [
    { value: 'all', label: 'Full fleet' },
    ...territorySegmentLabels.map((label) => ({ value: label as TerritoryFilterValue, label })),
  ]

  const cardSize = isCompact ? 'compact' : isExecutive ? 'executive' : 'default'
  const gapClass = isCompact ? 'gap-3' : isExecutive ? 'gap-8' : 'gap-6'
  const customGapClass = customTemplate?.spacing === 'compact' ? 'gap-3' : customTemplate?.spacing === 'spacious' ? 'gap-8' : 'gap-6'
  const customColsClass = customTemplate?.columns === 2 ? 'lg:grid-cols-2' : customTemplate?.columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'

  if (isCustom && customTemplate) {
    const sortedSections = [...customTemplate.sections].sort((a, b) => a.order - b.order)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${customTemplate.spacing === 'compact' ? 'py-4' : ''}`}>
          <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm shadow-md mb-6 p-4 sm:p-5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {customTemplate.headerTitle || 'Fleet Health Dashboard'}
            </h1>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {customTemplate.headerSubtitle || 'Overview of operational health, inspections, and risk indicators'}
            </p>
          </div>

          {sortedSections.map((sec) => {
            if (sec.type === 'territory_tabs') {
              return (
                <div key={sec.id} className="mb-6">
                  <div className="inline-flex gap-1 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60">
                    {territoryTabs.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTerritoryFilter(value)}
                        className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          territoryFilter === value
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }
            if (sec.type === 'key_metrics') {
              return (
                <div key={sec.id} className={`grid grid-cols-1 md:grid-cols-2 ${customColsClass} mb-8 ${customGapClass}`}>
                  <StatCard title="Total Vehicles" value={stats.totalVehicles} icon="fleet" color="blue" size={cardSize} />
                  <StatCard title="Active Vehicles" value={stats.activeVehicles} icon="active" color="green" size={cardSize} />
                  <StatCard title="Open Issues" value={stats.totalOpenIssues} icon="issues" color={stats.totalOpenIssues > 0 ? 'red' : 'green'} size={cardSize} />
                  <StatCard title="Expired Documents" value={stats.expiredDocuments} icon="documents" color={stats.expiredDocuments > 0 ? 'red' : 'green'} size={cardSize} />
                </div>
              )
            }
            if (sec.type === 'oil_status') {
              return (
                <div key={sec.id} className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Oil Change Status</h2>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{oilChangePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-3 rounded-full ${oilChangePercentage >= 80 ? 'bg-green-500' : oilChangePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${oilChangePercentage}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">OK:</span><span className="font-medium text-green-600 dark:text-green-400">{stats.vehiclesOkOil}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Due Soon:</span><span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.vehiclesDueSoonOil}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Overdue:</span><span className="font-medium text-red-600 dark:text-red-400">{stats.vehiclesOverdueOil}</span></div>
                  </div>
                </div>
              )
            }
            if (sec.type === 'inspection_status') {
              return (
                <div key={sec.id} className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Inspection Status</h2>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Pass Rate</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{inspectionPassRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className={`h-3 rounded-full ${inspectionPassRate >= 90 ? 'bg-green-500' : inspectionPassRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${inspectionPassRate}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Passed:</span><span className="font-medium text-green-600 dark:text-green-400">{stats.passedInspections}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Pending:</span><span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.pendingInspections}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Failed:</span><span className="font-medium text-red-600 dark:text-red-400">{stats.failedInspections}</span></div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700"><span className="text-gray-600 dark:text-gray-400">Total:</span><span className="font-medium text-gray-900 dark:text-white">{stats.totalInspections}</span></div>
                  </div>
                </div>
              )
            }
            if (sec.type === 'vehicle_status_breakdown') {
              return (
                <div key={sec.id} className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Vehicle Status Breakdown</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.activeVehicles}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{stats.outOfServiceVehicles}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Out of Service</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{stats.inShopVehicles}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">In Shop</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Critical Issues</div><div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.criticalIssues}</div></div>
                    <div><div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Due Soon Oil</div><div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{stats.vehiclesDueSoonOil}</div></div>
                    <div><div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overdue Oil</div><div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.vehiclesOverdueOil}</div></div>
                    <div><div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Inspections</div><div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalInspections}</div></div>
                  </div>
                </div>
              )
            }
            if (sec.type === 'quick_actions') {
              return (
                <div key={sec.id} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8`}>
                  <Link href="/dashboard" className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-3a2 2 0 011.9-1.37h12.2A2 2 0 0120 10l1 3m-1 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m0 0h16M7 13h.01M17 13h.01" /></svg></div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">View All Vehicles</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Manage your fleet</div>
                  </Link>
                  <Link href="/dashboard/drivers" className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 text-purple-600 dark:text-purple-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a9 9 0 0118 0" /></svg></div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">Manage Drivers</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Add and assign drivers</div>
                  </Link>
                  <Link href="/dashboard/inspections" className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m2 0h1a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1m2 0a2 2 0 104 0m-4 0a2 2 0 104 0" /></svg></div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">View Inspections</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Inspection history</div>
                  </Link>
                  <Link href="/dashboard/vehicles/new" className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2 text-amber-600 dark:text-amber-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">Add Vehicle</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Register new vehicle</div>
                  </Link>
                </div>
              )
            }
            if (sec.type === 'alerts') {
              const filteredIssues = issues.filter((i) => {
                const vehicleIds = territoryFilter === 'all' ? new Set(vehicles.map((v) => v.id)) : new Set(vehicles.filter((v) => getTerritory(v) === territoryFilter).map((v) => v.id))
                return vehicleIds.has(i.vehicle_id)
              })
              return (
                <div key={sec.id} className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Open Issues & Alerts</h2>
                  {filteredIssues.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No open issues.</p>
                  ) : (
                    <ul className="space-y-2">
                      {filteredIssues.slice(0, 10).map((issue) => (
                        <li key={issue.vehicle_id + issue.status} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Vehicle issue</span>
                          <span className={`text-xs font-medium ${issue.priority === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {issue.priority === 'critical' ? 'Critical' : 'Open'}
                          </span>
                        </li>
                      ))}
                      {filteredIssues.length > 10 && <li className="text-xs text-gray-500 dark:text-gray-400 pt-2">+{filteredIssues.length - 10} more</li>}
                    </ul>
                  )}
                </div>
              )
            }
            if (sec.type === 'custom_text') {
              const title = sec.config?.title || 'Notice'
              const body = sec.config?.body || ''
              return (
                <div key={sec.id} className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
                  {body ? <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{body}</p> : null}
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    )
  }

  const fleetLabel = companyName ? `${companyName} fleet` : 'Fleet'
  const subtitle = `${fleetLabel} • ${stats.totalVehicles} vehicle${stats.totalVehicles === 1 ? '' : 's'} • Updated just now`

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 ${isCompact ? 'py-4' : ''}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isCompact ? 'py-4' : 'py-8'}`}>
        {/* Header: Fleet Overview + subtitle */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className={`font-semibold tracking-tight text-gray-900 dark:text-white ${isCompact ? 'text-lg' : isExecutive ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
                Fleet Overview
              </h1>
              <p className={`mt-1.5 text-gray-500 dark:text-gray-400 ${isCompact ? 'text-[11px]' : 'text-sm'}`}>
                {subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Territory tabs */}
        <div className="mb-8">
          <div className="inline-flex gap-1 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/60">
            {territoryTabs.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTerritoryFilter(value)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  territoryFilter === value
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                }`}
              >
                <span className="relative z-10">{label}</span>
                {territoryFilter === value && (
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse opacity-20" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 ${isCompact ? 'gap-3 mb-8' : ''} ${isExecutive ? 'gap-8 mb-12' : ''}`}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon="fleet"
            color="blue"
            size={isCompact ? 'compact' : isExecutive ? 'executive' : 'default'}
          />
          <StatCard
            title="Active Vehicles"
            value={stats.activeVehicles}
            icon="active"
            color="green"
            size={isCompact ? 'compact' : isExecutive ? 'executive' : 'default'}
          />
          <StatCard
            title="Open Issues"
            value={stats.totalOpenIssues}
            icon="issues"
            color={stats.totalOpenIssues > 0 ? 'red' : 'green'}
            size={isCompact ? 'compact' : isExecutive ? 'executive' : 'default'}
          />
          <StatCard
            title="Expired Documents"
            value={stats.expiredDocuments}
            icon="documents"
            color={stats.expiredDocuments > 0 ? 'red' : 'green'}
            size={isCompact ? 'compact' : isExecutive ? 'executive' : 'default'}
          />
        </section>

        {/* Oil + Inspection panels */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/70 p-6">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
              Oil Change Status
            </h2>
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {oilChangePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <AnimatedProgressBar
                  percentage={oilChangePercentage}
                  colorClass={
                    oilChangePercentage >= 80
                      ? 'bg-green-500'
                      : oilChangePercentage >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }
                />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">OK</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.vehiclesOkOil}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">Due Soon</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{stats.vehiclesDueSoonOil}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.vehiclesOverdueOil}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700/70 p-6">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
              Inspection Status
            </h2>
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {inspectionPassRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <AnimatedProgressBar
                  percentage={inspectionPassRate}
                  colorClass={
                    inspectionPassRate >= 90
                      ? 'bg-green-500'
                      : inspectionPassRate >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }
                />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">Passed</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.passedInspections}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">Pending</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{stats.pendingInspections}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-600 dark:text-gray-400">Failed</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.failedInspections}</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Inspections</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.totalInspections}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Vehicle Status Breakdown — gradient cards */}
        <section className="mb-10">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            Vehicle Status Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <motion.div
              className="rounded-2xl p-5 bg-gradient-to-br from-green-50 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-200/60 dark:border-green-800/40 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.activeVehicles}</div>
              <div className="text-sm text-green-600/80 dark:text-green-400/80 mt-0.5">Active</div>
            </motion.div>
            <motion.div
              className="rounded-2xl p-5 bg-gradient-to-br from-red-50 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/10 border border-red-200/60 dark:border-red-800/40 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.outOfServiceVehicles}</div>
              <div className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">Out of Service</div>
            </motion.div>
            <motion.div
              className="rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200/60 dark:border-amber-800/40 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.inShopVehicles}</div>
              <div className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">In Shop</div>
            </motion.div>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Critical Issues</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.criticalIssues}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Due Soon Oil</div>
              <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">{stats.vehiclesDueSoonOil}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Overdue Oil</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.vehiclesOverdueOil}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total Inspections</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalInspections}</div>
            </div>
          </div>
        </section>

        {/* Quick Actions — action cards with hover lift + glow */}
        <section>
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <QuickActionCard
              href="/dashboard"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-3a2 2 0 011.9-1.37h12.2A2 2 0 0120 10l1 3m-1 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m0 0h16M7 13h.01M17 13h.01" />
                </svg>
              }
              iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              title="View All Vehicles"
              description="Manage your fleet and vehicle list."
            />
            <QuickActionCard
              href="/dashboard/drivers"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a9 9 0 0118 0" />
                </svg>
              }
              iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              title="Manage Drivers"
              description="Add and assign drivers to vehicles."
            />
            <QuickActionCard
              href="/dashboard/inspections"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m2 0h1a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1m2 0a2 2 0 104 0m-4 0a2 2 0 104 0" />
                </svg>
              }
              iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              title="View Inspections"
              description="Inspection history and status."
            />
            <QuickActionCard
              href="/dashboard/vehicles/new"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
              iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              title="Add Vehicle"
              description="Register a new vehicle to the fleet."
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function AnimatedProgressBar({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  return (
    <motion.div
      className={`h-full rounded-full ${colorClass}`}
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    />
  )
}

function QuickActionCard({
  href,
  icon,
  iconBg,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <motion.div
        className="bg-white/90 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/70 rounded-2xl p-5 shadow-sm"
        whileHover={{
          y: -3,
          transition: { duration: 0.2 },
          boxShadow: '0 12px 40px -12px rgba(139, 92, 246, 0.18), 0 0 0 1px rgba(139, 92, 246, 0.06)',
        }}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
          {icon}
        </div>
        <div className="font-semibold text-sm text-gray-900 dark:text-white">{title}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </motion.div>
    </Link>
  )
}

function AnimatedValue({ value, className }: { value: number; className: string }) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      displayRef.current = 0
      return
    }
    const duration = 520
    const start = performance.now()
    const startVal = displayRef.current
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - (1 - progress) ** 2
      const next = Math.round(startVal + (value - startVal) * easeOut)
      setDisplay(next)
      displayRef.current = next
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span className={className}>{display}</span>
}

function StatCard({
  title,
  value,
  icon,
  color,
  size = 'default',
}: {
  title: string
  value: number
  icon: 'fleet' | 'active' | 'issues' | 'documents'
  color: 'blue' | 'green' | 'red' | 'yellow'
  size?: 'compact' | 'default' | 'executive'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  }
  const sizeClasses = size === 'compact'
    ? 'p-3'
    : size === 'executive'
    ? 'p-6'
    : 'p-4'
  const titleClasses = size === 'compact'
    ? 'text-[10px]'
    : size === 'executive'
    ? 'text-xs'
    : 'text-[11px]'
  const valueClasses = size === 'compact'
    ? 'text-xl'
    : size === 'executive'
    ? 'text-3xl sm:text-4xl'
    : 'text-2xl'

  return (
    <motion.div
      className={`bg-white/85 dark:bg-gray-800/75 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 ${sizeClasses}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -3,
        transition: { duration: 0.2 },
        boxShadow: '0 12px 40px -12px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`${titleClasses} tracking-wide text-gray-600 dark:text-gray-400 uppercase`}>{title}</p>
          <p className={`${valueClasses} font-semibold text-gray-900 dark:text-white mt-1`}>
            <AnimatedValue value={value} className={valueClasses + ' font-semibold text-gray-900 dark:text-white'} />
          </p>
        </div>
        <div className={`rounded-xl ${size === 'compact' ? 'p-2' : size === 'executive' ? 'p-4' : 'p-3'} ${colorClasses[color]}`}>
          {icon === 'fleet' && (
            <svg className={size === 'compact' ? 'w-5 h-5' : size === 'executive' ? 'w-8 h-8' : 'w-6 h-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-3a2 2 0 011.9-1.37h12.2A2 2 0 0120 10l1 3m-1 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m0 0h16M7 13h.01M17 13h.01" />
            </svg>
          )}
          {icon === 'active' && (
            <svg className={size === 'compact' ? 'w-5 h-5' : size === 'executive' ? 'w-8 h-8' : 'w-6 h-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {icon === 'issues' && (
            <svg className={size === 'compact' ? 'w-5 h-5' : size === 'executive' ? 'w-8 h-8' : 'w-6 h-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {icon === 'documents' && (
            <svg className={size === 'compact' ? 'w-5 h-5' : size === 'executive' ? 'w-8 h-8' : 'w-6 h-6'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  )
}
