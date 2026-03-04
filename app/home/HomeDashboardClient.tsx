'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'

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

export default function HomeDashboardClient() {
  const [stats, setStats] = useState<FleetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load all vehicles
      const { data: vehicles } = await supabase.from('vehicles').select('*')
      
      // Load issues
      const { data: issues } = await supabase
        .from('issues')
        .select('status, priority')
        .neq('status', 'resolved')

      // Load documents
      const { data: documents } = await supabase
        .from('documents')
        .select('expiration_date')

      // Load inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('status')

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const vehicleList = vehicles || []
      const totalVehicles = vehicleList.length
      const activeVehicles = vehicleList.filter(v => v.status === 'active' || !v.status).length
      const outOfServiceVehicles = vehicleList.filter(v => v.status === 'out_of_service').length
      const inShopVehicles = vehicleList.filter(v => v.status === 'in_shop').length

      // Calculate oil change stats
      let vehiclesOverdueOil = 0
      let vehiclesDueSoonOil = 0
      let vehiclesOkOil = 0

      vehicleList.forEach((vehicle) => {
        const currentMileage = vehicle.current_mileage || 0
        const oilDueMileage = vehicle.oil_change_due_mileage || 0
        const milesUntilDue = oilDueMileage - currentMileage

        if (currentMileage >= oilDueMileage) {
          vehiclesOverdueOil++
        } else if (milesUntilDue <= 1000) {
          vehiclesDueSoonOil++
        } else {
          vehiclesOkOil++
        }
      })

      const oilChangePercentage = totalVehicles > 0 
        ? Math.round(((vehiclesOkOil + vehiclesDueSoonOil) / totalVehicles) * 100)
        : 0

      const issueList = issues || []
      const totalOpenIssues = issueList.length
      const criticalIssues = issueList.filter(i => i.priority === 'critical').length

      const documentList = documents || []
      const expiredDocuments = documentList.filter(
        (doc) => doc.expiration_date && new Date(doc.expiration_date) < today
      ).length

      const inspectionList = inspections || []
      const totalInspections = inspectionList.length
      const passedInspections = inspectionList.filter(i => i.status === 'passed').length
      const failedInspections = inspectionList.filter(i => i.status === 'failed').length
      const pendingInspections = inspectionList.filter(i => i.status === 'pending').length

      const inspectionPassRate = totalInspections > 0
        ? Math.round((passedInspections / totalInspections) * 100)
        : 0

      setStats({
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
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm p-6 sm:p-7 shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Fleet Health Dashboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-normal">
            Overview of operational health, inspections, and risk indicators
          </p>
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
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
              Oil Change Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
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
            <div className="space-y-2 text-sm">
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
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
              Inspection Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
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
            <div className="space-y-2 text-sm">
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
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            Vehicle Status Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.activeVehicles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {stats.outOfServiceVehicles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Out of Service</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {stats.inShopVehicles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Shop</div>
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
    <div className="bg-white/85 dark:bg-gray-800/75 rounded-xl shadow-md border border-gray-200/70 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-wide text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-4xl font-semibold text-gray-900 dark:text-white mt-2">{value}</p>
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
