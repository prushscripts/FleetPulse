'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Papa from 'papaparse'
import { normalizeTier, SubscriptionTier, TIER_CONFIG } from '@/lib/tiers'

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
  documents_count: number
  driver_name: string | null
  group_name: 'New York' | 'DMV'
  vehicle_type: string
}

type SortField = 'code' | 'current_mileage' | 'oil_status' | 'status'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'out_of_service' | 'in_shop'
type ToastState = {
  title: string
  message: string
  dismissing: boolean
}

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
  const [groupFilter, setGroupFilter] = useState<'all' | 'New York' | 'DMV'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'van' | 'truck' | 'suv' | 'other'>('all')
  const [oilFilter, setOilFilter] = useState<'all' | 'ok' | 'overdue'>('all')
  const [issuesFilter, setIssuesFilter] = useState<'all' | 'with_issues' | 'no_issues'>('all')
  const [docsFilter, setDocsFilter] = useState<'all' | 'with_docs' | 'expired_docs'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showAddIssueModal, setShowAddIssueModal] = useState(false)
  const [issueVehicle, setIssueVehicle] = useState<VehicleWithStats | null>(null)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issuePriority, setIssuePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [issueSaving, setIssueSaving] = useState(false)
  const [quickEditVehicle, setQuickEditVehicle] = useState<VehicleWithStats | null>(null)
  const [quickClosing, setQuickClosing] = useState(false)
  const [quickCode, setQuickCode] = useState('')
  const [quickMake, setQuickMake] = useState('')
  const [quickModel, setQuickModel] = useState('')
  const [quickYear, setQuickYear] = useState('')
  const [quickLicensePlate, setQuickLicensePlate] = useState('')
  const [quickVin, setQuickVin] = useState('')
  const [quickNotes, setQuickNotes] = useState('')
  const [quickMileage, setQuickMileage] = useState('')
  const [quickOilDueMileage, setQuickOilDueMileage] = useState('')
  const [quickStatus, setQuickStatus] = useState<Exclude<StatusFilter, 'all'>>('active')
  const [quickShopName, setQuickShopName] = useState('')
  const [quickShopAddress, setQuickShopAddress] = useState('')
  const [quickShopReason, setQuickShopReason] = useState('')
  const [quickDirty, setQuickDirty] = useState(false)
  const [quickSaving, setQuickSaving] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [userEmail, setUserEmail] = useState<string>('Unknown user')
  const [tier, setTier] = useState<SubscriptionTier>('professional')
  const [lastVehicleId, setLastVehicleId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    filterAndSortVehicles()
  }, [vehicles, searchQuery, statusFilter, sortField, sortDirection, groupFilter, typeFilter, oilFilter, issuesFilter, docsFilter])

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserEmail(user?.email || 'Unknown user')
      setTier(normalizeTier(user?.user_metadata?.subscription_tier))
    }
    loadUser()
  }, [supabase])

  useEffect(() => {
    const raw = sessionStorage.getItem('fleetpulse-dashboard-scroll')
    const lastId = sessionStorage.getItem('fleetpulse-last-vehicle')
    if (lastId) setLastVehicleId(lastId)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { y: number; t: number }
      if (Date.now() - parsed.t < 1000 * 60 * 30) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: parsed.y, behavior: 'auto' })
          window.setTimeout(() => {
            window.scrollTo({ top: parsed.y, behavior: 'auto' })
          }, 80)
        })
      }
    } catch (_err) {
      // ignore malformed state
    } finally {
      window.setTimeout(() => {
        sessionStorage.removeItem('fleetpulse-dashboard-scroll')
      }, 160)
    }
  }, [])

  const extractShopDetails = (notes: string | null) => {
    if (!notes) return { cleanedNotes: '', name: '', address: '', reason: '' }
    const match = notes.match(/\[SHOP\]\s*name:(.*?)\|address:(.*?)\|reason:(.*?)(\n|$)/)
    if (!match) return { cleanedNotes: notes, name: '', address: '', reason: '' }
    const cleaned = notes.replace(match[0], '').trim()
    return {
      cleanedNotes: cleaned,
      name: match[1]?.trim() || '',
      address: match[2]?.trim() || '',
      reason: match[3]?.trim() || '',
    }
  }

  const mergeNotesWithShop = (notes: string, name: string, address: string, reason: string, status: string) => {
    const base = notes.trim()
    if (status !== 'in_shop' || (!name && !address && !reason)) {
      return base || null
    }
    const shopLine = `[SHOP] name:${name || 'N/A'}|address:${address || 'N/A'}|reason:${reason || 'N/A'}`
    return base ? `${base}\n${shopLine}` : shopLine
  }

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

        const allDocuments = (documentsData || []).filter((doc) => doc.vehicle_id === vehicle.id).length

        const vehicleTypeGuess = (() => {
          const combined = `${vehicle.make || ''} ${vehicle.model || ''}`.toLowerCase()
          if (combined.includes('van') || combined.includes('transit') || combined.includes('cargo')) {
            return 'van'
          }
          if (combined.includes('truck') || combined.includes('f-') || combined.includes('ram')) {
            return 'truck'
          }
          if (combined.includes('suv') || combined.includes('explorer') || combined.includes('tahoe')) {
            return 'suv'
          }
          return 'other'
        })()

        const groupGuess = vehicle.code?.toLowerCase().includes('dmv') ? 'DMV' : 'New York'

        return {
          ...vehicle,
          status: vehicle.status || 'active',
          open_issues_count: openIssues,
          expired_documents_count: expiredDocuments,
          documents_count: allDocuments,
          driver_name: vehicle.driver_id ? driversMap.get(vehicle.driver_id) || null : null,
          group_name: groupGuess,
          vehicle_type: vehicleTypeGuess,
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

    if (groupFilter !== 'all') {
      filtered = filtered.filter((vehicle) => vehicle.group_name === groupFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((vehicle) => vehicle.vehicle_type === typeFilter)
    }

    if (oilFilter !== 'all') {
      filtered = filtered.filter((vehicle) => {
        const overdue = vehicle.current_mileage >= vehicle.oil_change_due_mileage
        return oilFilter === 'overdue' ? overdue : !overdue
      })
    }

    if (issuesFilter !== 'all') {
      filtered = filtered.filter((vehicle) =>
        issuesFilter === 'with_issues' ? vehicle.open_issues_count > 0 : vehicle.open_issues_count === 0
      )
    }

    if (docsFilter !== 'all') {
      filtered = filtered.filter((vehicle) =>
        docsFilter === 'with_docs' ? vehicle.documents_count > 0 : vehicle.expired_documents_count > 0
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
    if (!TIER_CONFIG[tier].features.csvImport) {
      showToast('Upgrade required', 'CSV import is available on Professional and Premium tiers.')
      return
    }
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

  const getVehicleStatusLabel = (status: string | null) => {
    if (status === 'out_of_service') return 'Out of Service'
    if (status === 'in_shop') return 'In Shop'
    return 'Active'
  }

  const getVehicleStatusColor = (status: string | null) => {
    if (status === 'out_of_service') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    if (status === 'in_shop') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  const showToast = (title: string, message: string) => {
    setToast({ title, message, dismissing: false })
    window.setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
      window.setTimeout(() => setToast(null), 260)
    }, 4200)
  }

  const dismissToast = () => {
    setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
    window.setTimeout(() => setToast(null), 260)
  }

  const openQuickEdit = (vehicle: VehicleWithStats) => {
    setQuickEditVehicle(vehicle)
    setQuickClosing(false)
    setQuickCode(vehicle.code || '')
    setQuickMake(vehicle.make || '')
    setQuickModel(vehicle.model || '')
    setQuickYear(vehicle.year ? String(vehicle.year) : '')
    setQuickLicensePlate(vehicle.license_plate || '')
    setQuickVin(vehicle.vin || '')
    const shop = extractShopDetails(vehicle.notes)
    setQuickNotes(shop.cleanedNotes || '')
    setQuickShopName(shop.name)
    setQuickShopAddress(shop.address)
    setQuickShopReason(shop.reason)
    setQuickMileage(String(vehicle.current_mileage))
    setQuickOilDueMileage(String(vehicle.oil_change_due_mileage))
    setQuickStatus((vehicle.status as Exclude<StatusFilter, 'all'>) || 'active')
    setQuickDirty(false)
  }

  const closeQuickEdit = () => {
    if (quickDirty) {
      setShowUnsavedModal(true)
      return
    }
    setQuickClosing(true)
    window.setTimeout(() => {
      setQuickEditVehicle(null)
      setQuickClosing(false)
      setQuickDirty(false)
    }, 200)
  }

  const handleConfirmClose = () => {
    setShowUnsavedModal(false)
    setQuickClosing(true)
    window.setTimeout(() => {
      setQuickEditVehicle(null)
      setQuickClosing(false)
      setQuickDirty(false)
    }, 200)
  }

  const handleCancelClose = () => {
    setShowUnsavedModal(false)
  }

  const handleQuickSave = async () => {
    if (!quickEditVehicle) return
    setQuickSaving(true)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          code: quickCode,
          make: quickMake || null,
          model: quickModel || null,
          year: quickYear ? Number(quickYear) : null,
          license_plate: quickLicensePlate || null,
          vin: quickVin || null,
          notes: mergeNotesWithShop(
            quickNotes,
            quickShopName,
            quickShopAddress,
            quickShopReason,
            quickStatus
          ),
          current_mileage: Number(quickMileage),
          oil_change_due_mileage: Number(quickOilDueMileage),
          status: quickStatus,
        })
        .eq('id', quickEditVehicle.id)
      if (error) throw error
      closeQuickEdit()
      await loadVehicles()
      showToast('Vehicle updated', `${quickEditVehicle.code} was saved successfully.`)
    } catch (error: any) {
      showToast('Save failed', error.message || 'Unable to update vehicle.')
    } finally {
      setQuickSaving(false)
    }
  }

  const navigateToVehicle = (vehicleId: string) => {
    sessionStorage.setItem('fleetpulse-last-vehicle', vehicleId)
    setLastVehicleId(vehicleId)
    sessionStorage.setItem(
      'fleetpulse-dashboard-scroll',
      JSON.stringify({ y: window.scrollY, t: Date.now() })
    )
    router.push(`/dashboard/vehicles/${vehicleId}`)
  }

  const openVehicleDocuments = (vehicleId: string) => {
    sessionStorage.setItem(
      'fleetpulse-dashboard-scroll',
      JSON.stringify({ y: window.scrollY, t: Date.now() })
    )
    router.push(`/dashboard/vehicles/${vehicleId}?tab=documents`)
  }

  const openAddIssueModal = (vehicle: VehicleWithStats) => {
    setIssueVehicle(vehicle)
    setIssueTitle('')
    setIssueDescription('')
    setIssuePriority('medium')
    setShowAddIssueModal(true)
  }

  const handleCreateIssue = async () => {
    if (!issueVehicle || !issueTitle.trim()) return
    setIssueSaving(true)
    try {
      const fullDescription = `${
        issueDescription.trim() ? `${issueDescription.trim()}\n\n` : ''
      }Opened by: ${userEmail}`

      const { error } = await supabase.from('issues').insert({
        vehicle_id: issueVehicle.id,
        title: issueTitle.trim(),
        description: fullDescription,
        status: 'open',
        priority: issuePriority,
        reported_date: new Date().toISOString().slice(0, 10),
      })
      if (error) throw error

      setShowAddIssueModal(false)
      setIssueVehicle(null)
      await loadVehicles()
      showToast('Issue created', `New issue logged for ${issueVehicle.code}.`)
    } catch (error: any) {
      showToast('Issue failed', error.message || 'Could not create issue.')
    } finally {
      setIssueSaving(false)
    }
  }

  const canAddVehicle = vehicles.length < TIER_CONFIG[tier].maxVehicles

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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                  Fleet Dashboard
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-normal">
                  Manage your fleet of <span className="font-medium text-indigo-600 dark:text-indigo-400">{vehicles.length}</span> vehicles
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Tier: <span className="font-medium capitalize">{tier}</span> • Limit {TIER_CONFIG[tier].maxVehicles} vehicles
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  disabled={!TIER_CONFIG[tier].features.csvImport}
                  className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Import CSV
                </button>
                {canAddVehicle ? (
                  <Link
                    href="/dashboard/vehicles/new"
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-medium tracking-wide transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    + Add Vehicle
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Vehicle limit reached',
                        `Your ${tier} tier supports up to ${TIER_CONFIG[tier].maxVehicles} vehicles.`
                      )
                    }
                    className="px-3.5 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium tracking-wide"
                  >
                    + Add Vehicle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Search and Filter Section */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by vehicle code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('code')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  sortField === 'code'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('current_mileage')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  sortField === 'current_mileage'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Mileage {sortField === 'current_mileage' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('oil_status')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  sortField === 'oil_status'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                }`}
              >
                Sort by Oil Status {sortField === 'oil_status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('out_of_service')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                statusFilter === 'out_of_service'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              Out of Service
            </button>
            <button
              onClick={() => setStatusFilter('in_shop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                statusFilter === 'in_shop'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              }`}
            >
              In Shop
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as 'all' | 'New York' | 'DMV')}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            >
              <option value="all">Group: All</option>
              <option value="New York">Group: New York</option>
              <option value="DMV">Group: DMV</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'van' | 'truck' | 'suv' | 'other')}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            >
              <option value="all">Type: All</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="suv">SUV</option>
              <option value="other">Other</option>
            </select>
            <select
              value={oilFilter}
              onChange={(e) => setOilFilter(e.target.value as 'all' | 'ok' | 'overdue')}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            >
              <option value="all">Oil: All</option>
              <option value="ok">Oil OK</option>
              <option value="overdue">Oil Overdue</option>
            </select>
            <select
              value={issuesFilter}
              onChange={(e) => setIssuesFilter(e.target.value as 'all' | 'with_issues' | 'no_issues')}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            >
              <option value="all">Issues: All</option>
              <option value="with_issues">With issues</option>
              <option value="no_issues">No issues</option>
            </select>
            <select
              value={docsFilter}
              onChange={(e) => setDocsFilter(e.target.value as 'all' | 'with_docs' | 'expired_docs')}
              className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
            >
              <option value="all">Documents: All</option>
              <option value="with_docs">With documents</option>
              <option value="expired_docs">Expired docs</option>
            </select>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr className="text-left text-xs tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Plate</th>
                    <th className="px-4 py-3">Group</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Mileage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Open Issues</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVehicles.map((vehicle) => {
                    const oilStatus = getOilStatus(vehicle)
                    return (
                      <tr
                        key={vehicle.id}
                        className={`text-sm ${
                          lastVehicleId === vehicle.id
                            ? 'bg-indigo-50/30 dark:bg-indigo-900/20 border-l-2 border-indigo-500'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button onClick={() => navigateToVehicle(vehicle.id)} className="text-left">
                            <p className="font-semibold text-gray-900 dark:text-white">{vehicle.code}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                              {vehicle.vin ? ` - VIN ${vehicle.vin}` : ''}
                            </p>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {vehicle.license_plate || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{vehicle.group_name}</td>
                        <td className="px-4 py-3 uppercase text-xs text-gray-700 dark:text-gray-200">{vehicle.vehicle_type}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          <div>{vehicle.current_mileage.toLocaleString()}</div>
                          <div className={`text-xs ${oilStatus.status === 'overdue' ? 'text-red-500' : 'text-green-500'}`}>
                            due {vehicle.oil_change_due_mileage.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVehicleStatusColor(vehicle.status)}`}>
                            {getVehicleStatusLabel(vehicle.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{vehicle.open_issues_count}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {vehicle.documents_count}
                          {vehicle.expired_documents_count > 0 ? (
                            <span className="ml-1 text-xs text-red-500">({vehicle.expired_documents_count} expired)</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2.5">
                            <button
                              type="button"
                              onClick={() => openVehicleDocuments(vehicle.id)}
                              className="px-3 py-1 rounded-md text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            >
                              Documents
                            </button>
                            <button
                              type="button"
                              onClick={() => openAddIssueModal(vehicle)}
                              className="px-3 py-1 rounded-md text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            >
                              + Issue
                            </button>
                            <button
                              type="button"
                              onClick={() => openQuickEdit(vehicle)}
                              className="px-3 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Premium Vehicle Cards Grid */}
        <div className={`${viewMode === 'list' ? 'grid md:hidden' : 'grid'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          {filteredVehicles.map((vehicle) => {
            const oilStatus = getOilStatus(vehicle)
            return (
              <article
                key={vehicle.id}
                onClick={() => navigateToVehicle(vehicle.id)}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-purple-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-purple-50/30 group-hover:to-indigo-50/50 dark:group-hover:from-indigo-900/10 dark:group-hover:via-purple-900/10 dark:group-hover:to-indigo-900/10 transition-all duration-300 pointer-events-none"></div>
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        {vehicle.group_name} • {vehicle.vehicle_type.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openQuickEdit(vehicle)
                        }}
                        className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        aria-label={`Quick edit ${vehicle.code}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getVehicleStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {getVehicleStatusLabel(vehicle.status)}
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
                <div className="mt-4 pt-3 border-t border-gray-200/80 dark:border-gray-700/80 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openVehicleDocuments(vehicle.id)
                    }}
                    className="mr-2 text-xs font-medium tracking-wide text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Documents
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openAddIssueModal(vehicle)
                    }}
                    className="mr-2 text-xs font-medium tracking-wide text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                  >
                    + Issue
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToVehicle(vehicle.id)
                    }}
                    className="text-xs font-medium tracking-wide text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Open details
                  </button>
                </div>
              </article>
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

      {quickEditVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeQuickEdit}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl ${
              quickClosing ? 'animate-quick-edit-close' : 'animate-fade-in-scale'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                  Quick Edit
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{quickEditVehicle.code}</p>
              </div>
              <button
                type="button"
                onClick={closeQuickEdit}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Close quick edit"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Code</label>
                <input value={quickCode} onChange={(e) => { setQuickCode(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">License Plate</label>
                <input value={quickLicensePlate} onChange={(e) => { setQuickLicensePlate(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Make</label>
                <input value={quickMake} onChange={(e) => { setQuickMake(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Model</label>
                <input value={quickModel} onChange={(e) => { setQuickModel(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Year</label>
                <input type="number" value={quickYear} onChange={(e) => { setQuickYear(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">VIN</label>
                <input value={quickVin} onChange={(e) => { setQuickVin(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Current Mileage</label>
                <input type="number" value={quickMileage} onChange={(e) => { setQuickMileage(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Oil Change Due Mileage</label>
                <input type="number" value={quickOilDueMileage} onChange={(e) => { setQuickOilDueMileage(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Status</label>
                <select
                  value={quickStatus}
                  onChange={(e) => {
                    setQuickStatus(e.target.value as Exclude<StatusFilter, 'all'>)
                    setQuickDirty(true)
                  }}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="in_shop">In Shop</option>
                </select>
              </div>
              {quickStatus === 'in_shop' && (
                <>
                  <div>
                    <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Shop Name (optional)</label>
                    <input value={quickShopName} onChange={(e) => { setQuickShopName(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Shop Address (optional)</label>
                    <input value={quickShopAddress} onChange={(e) => { setQuickShopAddress(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Reason in shop (optional)</label>
                    <input value={quickShopReason} onChange={(e) => { setQuickShopReason(e.target.value); setQuickDirty(true) }} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">Notes</label>
                <textarea value={quickNotes} onChange={(e) => { setQuickNotes(e.target.value); setQuickDirty(true) }} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={quickSaving}
                className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium py-2.5 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {quickSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={closeQuickEdit}
                className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-5 bottom-5 z-[60]">
          <button
            type="button"
            onClick={dismissToast}
            className={`relative text-left overflow-hidden rounded-xl border border-indigo-300/60 dark:border-indigo-700/60 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-2xl p-4 w-80 transition-all duration-300 ${
              toast.dismissing ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{toast.message}</p>
              </div>
              <span className="text-indigo-500">✨</span>
            </div>
            <div className="mt-3 h-1 w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-toast-progress" />
            </div>
            {toast.dismissing && (
              <div className="pointer-events-none absolute right-3 top-3 text-indigo-400 animate-ping">✦</div>
            )}
          </button>
        </div>
      )}

      {showAddIssueModal && issueVehicle && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddIssueModal(false)
            setIssueVehicle(null)
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-lg w-full animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              Add Issue - {issueVehicle.code}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">
              Opened by {userEmail} • Status will default to Open
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
                  Issue Title
                </label>
                <input
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g. Brake warning light, Tire damage"
                />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
                  Severity
                </label>
                <select
                  value={issuePriority}
                  onChange={(e) =>
                    setIssuePriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Moderate</option>
                  <option value="high">Severe</option>
                  <option value="critical">Immediate Action</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide text-gray-600 dark:text-gray-300 mb-1.5">
                  Details
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="What happened? Any safety risk? What should be checked?"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCreateIssue}
                disabled={issueSaving || !issueTitle.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium py-2.5 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {issueSaving ? 'Saving...' : 'Create Issue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddIssueModal(false)
                  setIssueVehicle(null)
                }}
                className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowImportModal(false)
            setCsvFile(null)
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full transform transition-all animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Custom Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unsaved Changes</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Close Without Saving
              </button>
              <button
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all"
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
