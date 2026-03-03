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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Health Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Overview of your fleet's health and status
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon="🚗"
            color="blue"
          />
          <StatCard
            title="Active Vehicles"
            value={stats.activeVehicles}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Open Issues"
            value={stats.totalOpenIssues}
            icon="⚠️"
            color={stats.totalOpenIssues > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Expired Documents"
            value={stats.expiredDocuments}
            icon="📄"
            color={stats.expiredDocuments > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Fleet Health Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Oil Change Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Oil Change Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {oilChangePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
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
                <span className="text-gray-600 dark:text-gray-400">✅ OK:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.vehiclesOkOil}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">⚠️ Due Soon:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {stats.vehiclesDueSoonOil}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">🔴 Overdue:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats.vehiclesOverdueOil}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Inspection Status
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inspectionPassRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
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
                <span className="text-gray-600 dark:text-gray-400">✅ Passed:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.passedInspections}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">⏳ Pending:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {stats.pendingInspections}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">🔴 Failed:</span>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🚗</div>
            <div className="font-semibold text-gray-900 dark:text-white">View All Vehicles</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your fleet
            </div>
          </Link>
          <Link
            href="/dashboard/drivers"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-semibold text-gray-900 dark:text-white">Manage Drivers</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add and assign drivers
            </div>
          </Link>
          <Link
            href="/dashboard/inspections"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-gray-900 dark:text-white">View Inspections</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Inspection history
            </div>
          </Link>
          <Link
            href="/dashboard/vehicles/new"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-semibold text-gray-900 dark:text-white">Add Vehicle</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
  icon: string
  color: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`text-4xl p-3 rounded-full ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
