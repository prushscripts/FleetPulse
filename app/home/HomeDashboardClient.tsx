'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type TerritoryFilterValue = 'all' | 'New York' | 'DMV'

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
}: {
  territoryMap?: Record<string, string>
  companyId?: string | null
}) {
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
    { value: 'New York', label: 'New York' },
    { value: 'DMV', label: 'DMV' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-4 sm:p-5 shadow-md">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Fleet Health Dashboard
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-normal">
            Overview of operational health, inspections, and risk indicators
          </p>
        </div>

        {/* Territory tabs: Full fleet | New York | DMV */}
        <div className="mb-6">
          <div className="inline-flex gap-1 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60">
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon="fleet"
            color="blue"
          />
          <StatCard
            title="Active Vehicles"
            value={stats.activeVehicles}
            icon="active"
            color="green"
          />
          <StatCard
            title="Open Issues"
            value={stats.totalOpenIssues}
            icon="issues"
            color={stats.totalOpenIssues > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Expired Documents"
            value={stats.expiredDocuments}
            icon="documents"
            color={stats.expiredDocuments > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Fleet Health Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Oil Change Status */}
          <div className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
              Oil Change Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {oilChangePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    oilChangePercentage >= 80
                      ? 'bg-green-500'
                      : oilChangePercentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${oilChangePercentage}%` }}
                />
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">OK:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.vehiclesOkOil}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Due Soon:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {stats.vehiclesDueSoonOil}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Overdue:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats.vehiclesOverdueOil}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Status */}
          <div className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
              Inspection Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Pass Rate</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {inspectionPassRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    inspectionPassRate >= 90
                      ? 'bg-green-500'
                      : inspectionPassRate >= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${inspectionPassRate}%` }}
                />
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Passed:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.passedInspections}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {stats.pendingInspections}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats.failedInspections}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Inspections:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.totalInspections}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="bg-white/80 dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
            Vehicle Status Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.activeVehicles}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {stats.outOfServiceVehicles}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Out of Service</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {stats.inShopVehicles}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">In Shop</div>
            </div>
          </div>
          
          {/* Additional Metrics Row */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Critical Issues</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.criticalIssues}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Due Soon Oil</div>
              <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{stats.vehiclesDueSoonOil}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overdue Oil</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.vehiclesOverdueOil}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Inspections</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalInspections}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard"
            className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-3a2 2 0 011.9-1.37h12.2A2 2 0 0120 10l1 3m-1 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m0 0h16M7 13h.01M17 13h.01" />
              </svg>
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">View All Vehicles</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Manage your fleet
            </div>
          </Link>
          <Link
            href="/dashboard/drivers"
            className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a9 9 0 0118 0" />
              </svg>
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">Manage Drivers</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Add and assign drivers
            </div>
          </Link>
          <Link
            href="/dashboard/inspections"
            className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m2 0h1a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1m2 0a2 2 0 104 0m-4 0a2 2 0 104 0" />
              </svg>
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">View Inspections</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Inspection history
            </div>
          </Link>
          <Link
            href="/dashboard/vehicles/new"
            className="bg-white/85 dark:bg-gray-800/75 border border-gray-200/70 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white">Add Vehicle</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Register new vehicle
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: 'fleet' | 'active' | 'issues' | 'documents'
  color: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  }

  return (
    <div className="bg-white/85 dark:bg-gray-800/75 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] tracking-wide text-gray-600 dark:text-gray-400 uppercase">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon === 'fleet' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13l1-3a2 2 0 011.9-1.37h12.2A2 2 0 0120 10l1 3m-1 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m0 0h16M7 13h.01M17 13h.01" />
            </svg>
          )}
          {icon === 'active' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {icon === 'issues' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {icon === 'documents' && (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
