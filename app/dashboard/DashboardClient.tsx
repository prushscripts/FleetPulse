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
}

interface VehicleWithStats extends Vehicle {
  open_issues_count: number
  expired_documents_count: number
}

type SortField = 'code' | 'current_mileage' | 'oil_status'
type SortDirection = 'asc' | 'desc'

export default function DashboardClient() {
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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
  }, [vehicles, searchQuery, sortField, sortDirection])

  const loadVehicles = async () => {
    try {
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('code', { ascending: true })

      if (vehiclesError) throw vehiclesError

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
          open_issues_count: openIssues,
          expired_documents_count: expiredDocuments,
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'oil_status') {
        const aOverdue = a.current_mileage >= a.oil_change_due_mileage
        const bOverdue = b.current_mileage >= b.oil_change_due_mileage
        aValue = aOverdue ? 1 : 0
        bValue = bOverdue ? 1 : 0
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your fleet of {vehicles.length} vehicles
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium"
            >
              Import CSV
            </button>
            <Link
              href="/dashboard/vehicles/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
            >
              Add Vehicle
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by vehicle code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('code')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortField === 'code'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Sort by Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('current_mileage')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortField === 'current_mileage'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Sort by Mileage {sortField === 'current_mileage' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('oil_status')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                sortField === 'oil_status'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Sort by Oil Status {sortField === 'oil_status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const oilStatus = getOilStatus(vehicle)
            return (
              <Link
                key={vehicle.id}
                href={`/dashboard/vehicles/${vehicle.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {vehicle.code}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${oilStatus.color}`}
                  >
                    {oilStatus.status === 'overdue' ? 'Oil Overdue' : 'Oil OK'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Mileage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {vehicle.current_mileage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Oil Change Due:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {vehicle.oil_change_due_mileage.toLocaleString()}
                    </span>
                  </div>
                  {vehicle.make && vehicle.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Open Issues:</span>
                    <span
                      className={`font-medium ${
                        vehicle.open_issues_count > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {vehicle.open_issues_count}
                    </span>
                  </div>
                  {vehicle.expired_documents_count > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expired Docs:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {vehicle.expired_documents_count}
                      </span>
                    </div>
                  )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Import Vehicles from CSV</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              CSV should have columns: code, make, model, year, current_mileage, oil_change_due_mileage, license_plate, vin, notes
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="mb-4 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex gap-4">
              <button
                onClick={handleCsvImport}
                disabled={!csvFile}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setCsvFile(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
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
