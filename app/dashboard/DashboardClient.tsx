'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Papa from 'papaparse'

interface Vehicle {
  id: string
  code: string
  make: string | null
  model: string | null
  year: number | null
  current_mileage: number
  oil_change_due_mileage: number
  license_plate: string | null
  vin: string | null
  notes: string | null
  status: string | null
  driver_id: string | null
}

interface VehicleWithStats extends Vehicle {
  open_issues_count: number
  expired_documents_count: number
  driver_name: string | null
}

type SortField = 'code' | 'current_mileage' | 'oil_status' | 'status'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'out_of_service' | 'in_shop'

export default function DashboardClient() {
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterAndSortVehicles()
  }, [vehicles, searchQuery, statusFilter, sortField, sortDirection])

  const loadVehicles = async () => {
    try {
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('code', { ascending: true })

      if (vehiclesError) throw vehiclesError

      // Fetch drivers
      const { data: driversData } = await supabase.from('drivers').select('id, first_name, last_name')

      // Fetch issues count for each vehicle
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('vehicle_id, status')

      if (issuesError) throw issuesError

      // Fetch documents with expiration dates
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('vehicle_id, expiration_date')

      if (documentsError) throw documentsError

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const driversMap = new Map()
      driversData?.forEach((driver) => {
        driversMap.set(driver.id, `${driver.first_name} ${driver.last_name}`)
      })

      const vehiclesWithStats: VehicleWithStats[] = (vehiclesData || []).map((vehicle) => {
        const openIssues = (issuesData || []).filter(
          (issue) => issue.vehicle_id === vehicle.id && issue.status !== 'resolved'
        ).length

        const expiredDocuments = (documentsData || []).filter(
          (doc) =>
            doc.vehicle_id === vehicle.id &&
            doc.expiration_date &&
            new Date(doc.expiration_date) < today
        ).length

        return {
          ...vehicle,
          status: vehicle.status || 'active',
          open_issues_count: openIssues,
          expired_documents_count: expiredDocuments,
          driver_name: vehicle.driver_id ? driversMap.get(vehicle.driver_id) || null : null,
        }
      })

      setVehicles(vehiclesWithStats)
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortVehicles = () => {
    let filtered = [...vehicles]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((vehicle) =>
        vehicle.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((vehicle) => {
        const vehicleStatus = vehicle.status || 'active'
        return vehicleStatus === statusFilter
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'oil_status') {
        const aOverdue = a.current_mileage >= a.oil_change_due_mileage
        const bOverdue = b.current_mileage >= b.oil_change_due_mileage
        aValue = aOverdue ? 1 : 0
        bValue = bOverdue ? 1 : 0
      } else if (sortField === 'status') {
        aValue = a.status || 'active'
        bValue = b.status || 'active'
      } else {
        aValue = a[sortField]
        bValue = b[sortField]
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredVehicles(filtered)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getOilStatus = (vehicle: VehicleWithStats) => {
    const isOverdue = vehicle.current_mileage >= vehicle.oil_change_due_mileage
    return {
      status: isOverdue ? 'overdue' : 'ok',
      color: isOverdue
        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    }
  }

  const handleCsvImport = async () => {
    if (!csvFile) return

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const vehiclesToInsert = results.data.map((row: any) => ({
            code: row.code || row.Code || row.CODE,
            make: row.make || row.Make || row.MAKE || null,
            model: row.model || row.Model || row.MODEL || null,
            year: row.year || row.Year || row.YEAR ? parseInt(row.year || row.Year || row.YEAR) : null,
            current_mileage: parseInt(row.current_mileage || row.Current_Mileage || row.CURRENT_MILEAGE || '0'),
            oil_change_due_mileage: parseInt(
              row.oil_change_due_mileage || row.Oil_Change_Due_Mileage || row.OIL_CHANGE_DUE_MILEAGE || '0'
            ),
            license_plate: row.license_plate || row.License_Plate || row.LICENSE_PLATE || null,
            vin: row.vin || row.VIN || null,
            notes: row.notes || row.Notes || row.NOTES || null,
          }))

          const { error } = await supabase.from('vehicles').insert(vehiclesToInsert)

          if (error) throw error

          setShowImportModal(false)
          setCsvFile(null)
          loadVehicles()
        } catch (error: any) {
          alert('Error importing CSV: ' + error.message)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading vehicles...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header Section */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/10 dark:from-indigo-600/20 dark:via-purple-600/20 dark:to-indigo-600/20 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                  Fleet Dashboard
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Manage your fleet of <span className="font-semibold text-indigo-600 dark:text-indigo-400">{vehicles.length}</span> vehicles
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Import CSV
                </button>
                <Link
                  href="/dashboard/vehicles/new"
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  + Add Vehicle
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Search and Filter Section */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by vehicle code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('code')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortField === 'code'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('current_mileage')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortField === 'current_mileage'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Mileage {sortField === 'current_mileage' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('oil_status')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortField === 'oil_status'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Oil Status {sortField === 'oil_status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('out_of_service')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'out_of_service'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              Out of Service
            </button>
            <button
              onClick={() => setStatusFilter('in_shop')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'in_shop'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              In Shop
            </button>
          </div>
        </div>

        {/* Premium Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const oilStatus = getOilStatus(vehicle)
            return (
              <Link
                key={vehicle.id}
                href={`/dashboard/vehicles/${vehicle.id}`}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-purple-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-purple-50/30 group-hover:to-indigo-50/50 dark:group-hover:from-indigo-900/10 dark:group-hover:via-purple-900/10 dark:group-hover:to-indigo-900/10 transition-all duration-300 pointer-events-none"></div>
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {vehicle.code}
                      </h3>
                      {vehicle.driver_name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {vehicle.driver_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          vehicle.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : vehicle.status === 'out_of_service'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : vehicle.status === 'in_shop'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {vehicle.status === 'active'
                          ? 'Active'
                          : vehicle.status === 'out_of_service'
                          ? 'Out of Service'
                          : vehicle.status === 'in_shop'
                          ? 'In Shop'
                          : 'Active'}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${oilStatus.color}`}
                      >
                        {oilStatus.status === 'overdue' ? '⚠ Oil Overdue' : '✓ Oil OK'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Current Mileage
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {vehicle.current_mileage.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Oil Change Due
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {vehicle.oil_change_due_mileage.toLocaleString()}
                      </span>
                    </div>
                    {vehicle.make && vehicle.model && (
                      <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Vehicle
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Open Issues
                      </span>
                      <span
                        className={`font-semibold ${
                          vehicle.open_issues_count > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {vehicle.open_issues_count}
                      </span>
                    </div>
                    {vehicle.expired_documents_count > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Expired Docs
                        </span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {vehicle.expired_documents_count}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No vehicles found matching your search.' : 'No vehicles yet. Add your first vehicle!'}
            </p>
          </div>
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full transform transition-all">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
              Import Vehicles from CSV
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              CSV should have columns: code, make, model, year, current_mileage, oil_change_due_mileage, license_plate, vin, notes
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCsvImport}
                disabled={!csvFile}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setCsvFile(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
