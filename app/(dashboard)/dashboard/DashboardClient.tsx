'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { Search, Upload, Plus, FileText, Edit2, Truck, CheckCircle, AlertTriangle, Wrench, ClipboardCheck, ArrowRight, UserPlus, Copy, User, ChevronRight } from 'lucide-react'
import { normalizeTier, SubscriptionTier, TIER_CONFIG } from '@/lib/tiers'
import { getUserDisplayName } from '@/lib/user-utils'
import type { VehicleWithStats } from '@/lib/dashboard-types'
import QuickAssignPopover from '@/components/vehicles/QuickAssignPopover'
import VehiclePanel from '@/components/vehicles/VehiclePanel'

type SortField = 'code' | 'current_mileage' | 'oil_status' | 'status'
type SortDirection = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'out_of_service' | 'in_shop' | 'hidden'
type TerritoryFilterValue = 'all' | 'New York' | 'DMV' | 'Other'
type ToastState = {
  title: string
  message: string
  dismissing: boolean
}

export default function DashboardClient(
  { plateMap = {}, territoryMap = {}, companyId, initialVehicles }: { plateMap?: Record<string, string>; territoryMap?: Record<string, string>; companyId?: string; initialVehicles?: VehicleWithStats[] }
) {
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>(initialVehicles ?? [])
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithStats[]>(initialVehicles ?? [])
  const [loading, setLoading] = useState(initialVehicles === undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [territoryFilter, setTerritoryFilter] = useState<TerritoryFilterValue>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [groupFilter, setGroupFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [oilFilter, setOilFilter] = useState<string[]>([])
  const [issuesFilter, setIssuesFilter] = useState<string[]>([])
  const [docsFilter, setDocsFilter] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showFilters, setShowFilters] = useState(false)
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
  const [userDisplayName, setUserDisplayName] = useState<string>('Unknown user')
  const [companyName, setCompanyName] = useState<string>('Your Company')
  const [tier, setTier] = useState<SubscriptionTier>('professional')
  const [lastVehicleId, setLastVehicleId] = useState<string | null>(null)
  const [hiddenVehicles, setHiddenVehicles] = useState<string[]>([])
  const [allDrivers, setAllDrivers] = useState<Array<{ id: string; name: string; email?: string | null; location?: string | null; isNYDriver?: boolean; isDMVDriver?: boolean }>>([])
  const [quickAssignVehicleId, setQuickAssignVehicleId] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStats | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (initialVehicles !== undefined) {
      setVehicles(initialVehicles)
      setLoading(false)
      return
    }
    loadVehicles()
  }, [])

  useEffect(() => {
    filterAndSortVehicles()
  }, [vehicles, searchQuery, territoryFilter, statusFilter, sortField, sortDirection, groupFilter, typeFilter, oilFilter, issuesFilter, docsFilter, hiddenVehicles])

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false)
      }
    }

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilters])

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserDisplayName(getUserDisplayName(user))
      setCompanyName(
        (user?.user_metadata?.company_name as string) ||
          (user?.user_metadata?.company_id as string) ||
          'Your Company',
      )
      setTier(normalizeTier(user?.user_metadata?.subscription_tier))
      // Load hidden vehicles from user metadata
      if (user?.user_metadata?.hidden_vehicles && Array.isArray(user.user_metadata.hidden_vehicles)) {
        setHiddenVehicles(user.user_metadata.hidden_vehicles)
      }
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
      // Fetch vehicles (scoped by company when multi-tenant)
      let vehiclesQuery = supabase.from('vehicles').select('*').order('code', { ascending: true })
      if (companyId) vehiclesQuery = vehiclesQuery.eq('company_id', companyId)
      const { data: vehiclesData, error: vehiclesError } = await vehiclesQuery
      if (vehiclesError) throw vehiclesError

      // Fetch drivers (scoped by company when multi-tenant)
      let driversQuery = supabase.from('drivers').select('id, first_name, last_name, email, phone, location, is_ny_driver, is_dmv_driver')
      if (companyId) driversQuery = driversQuery.eq('company_id', companyId)
      const { data: driversData } = await driversQuery

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

      const driversMap = new Map<string, { name: string; phone: string | null }>()
      driversData?.forEach((d: { id: string; first_name?: string; last_name?: string; phone?: string | null }) => {
        driversMap.set(d.id, {
          name: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'Driver',
          phone: d.phone ?? null,
        })
      })
      setAllDrivers((driversData || []).map((d: any) => ({
        id: d.id,
        name: `${d.first_name} ${d.last_name}`,
        email: d.email ?? null,
        location: d.location ?? null,
        isNYDriver: !!d.is_ny_driver,
        isDMVDriver: !!d.is_dmv_driver,
      })))

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
          driver_name: vehicle.driver_id ? driversMap.get(vehicle.driver_id)?.name ?? null : null,
          driver_phone: vehicle.driver_id ? driversMap.get(vehicle.driver_id)?.phone ?? null : null,
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

  const getTerritory = (vehicle: VehicleWithStats): TerritoryFilterValue => {
    const code = vehicle.code?.toLowerCase()
    const fromMap = code ? territoryMap[code] : undefined
    if (fromMap === 'New York' || fromMap === 'DMV' || fromMap === 'Other') return fromMap
    if (vehicle.group_name === 'New York' || vehicle.group_name === 'DMV') return vehicle.group_name
    return 'Other'
  }

  const filterAndSortVehicles = () => {
    let filtered = [...vehicles]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((vehicle) =>
        (vehicle.code?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
      )
    }

    // Apply territory filter (All / New York / DMV / Other)
    if (territoryFilter !== 'all') {
      filtered = filtered.filter((vehicle) => getTerritory(vehicle) === territoryFilter)
    }

    // Apply status filter
    if (statusFilter === 'hidden') {
      // Show only hidden vehicles
      filtered = filtered.filter((vehicle) => hiddenVehicles.includes(vehicle.id))
    } else if (statusFilter !== 'all') {
      // Apply normal status filter and exclude hidden vehicles
      filtered = filtered.filter((vehicle) => {
        const vehicleStatus = vehicle.status || 'active'
        return vehicleStatus === statusFilter && !hiddenVehicles.includes(vehicle.id)
      })
    } else {
      // Show all except hidden vehicles
      filtered = filtered.filter((vehicle) => !hiddenVehicles.includes(vehicle.id))
    }

    if (groupFilter.length > 0) {
      filtered = filtered.filter((vehicle) => groupFilter.includes(vehicle.group_name))
    }

    if (typeFilter.length > 0) {
      filtered = filtered.filter((vehicle) => typeFilter.includes(vehicle.vehicle_type))
    }

    if (oilFilter.length > 0) {
      filtered = filtered.filter((vehicle) => {
        const current = vehicle.current_mileage ?? 0
        const due = vehicle.oil_change_due_mileage ?? 0
        const overdue = due > 0 && current >= due
        if (oilFilter.includes('overdue') && oilFilter.includes('ok')) return true
        if (oilFilter.includes('overdue')) return overdue
        if (oilFilter.includes('ok')) return !overdue
        return false
      })
    }

    if (issuesFilter.length > 0) {
      filtered = filtered.filter((vehicle) => {
        if (issuesFilter.includes('with_issues') && issuesFilter.includes('no_issues')) return true
        if (issuesFilter.includes('with_issues')) return vehicle.open_issues_count > 0
        if (issuesFilter.includes('no_issues')) return vehicle.open_issues_count === 0
        return false
      })
    }

    if (docsFilter.length > 0) {
      filtered = filtered.filter((vehicle) => {
        if (docsFilter.includes('with_docs') && docsFilter.includes('expired_docs')) return true
        if (docsFilter.includes('with_docs')) return vehicle.documents_count > 0
        if (docsFilter.includes('expired_docs')) return vehicle.expired_documents_count > 0
        return false
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortField === 'oil_status') {
        const aDue = (a.oil_change_due_mileage ?? 0)
        const bDue = (b.oil_change_due_mileage ?? 0)
        const aOverdue = aDue > 0 && (a.current_mileage ?? 0) >= aDue
        const bOverdue = bDue > 0 && (b.current_mileage ?? 0) >= bDue
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
    const current = vehicle.current_mileage ?? 0
    const due = vehicle.oil_change_due_mileage ?? 0
    const isOverdue = due > 0 && current >= due
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
            license_plate: row.license_plate || row.License_Plate || row.LICENSE_PLATE || 
                           row['License Plate'] || row['LICENSE PLATE'] || 
                           row.plate || row.Plate || row.PLATE ||
                           row['State Plate'] || row['STATE PLATE'] || null,
            vin: row.vin || row.VIN || null,
            notes: row.notes || row.Notes || row.NOTES || null,
            ...(companyId && { company_id: companyId }),
          }))

          // Use upsert to update existing vehicles by code, or insert new ones
          const { error } = await supabase
            .from('vehicles')
            .upsert(vehiclesToInsert, { 
              onConflict: 'code',
              ignoreDuplicates: false 
            })

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
      setQuickDirty(false)
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

  const openVehiclePanel = (vehicle: VehicleWithStats) => {
    setSelectedVehicle(vehicle)
    setPanelOpen(true)
  }

  const copyVehicleSummary = (e: React.MouseEvent, vehicle: VehicleWithStats) => {
    e.stopPropagation()
    const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
    const line = `Truck #${vehicle.code ?? ''} | ${ymm || '—'} | Driver: ${vehicle.driver_name ?? 'Unassigned'} | Phone: ${vehicle.driver_phone ?? '—'} | Mileage: ${(vehicle.current_mileage ?? 0).toLocaleString()} | Oil Due: ${(vehicle.oil_change_due_mileage ?? 0).toLocaleString()}`
    navigator.clipboard.writeText(line)
    showToast('Copied', 'Vehicle summary copied to clipboard.')
  }

  const unassignDriverFromVehicle = async (vehicleId: string) => {
    const res = await fetch(`/api/vehicles/${vehicleId}/unassign-driver`, { method: 'POST' })
    if (!res.ok) throw new Error('Unable to unassign driver')
    await loadVehicles()
    if (selectedVehicle?.id === vehicleId) setSelectedVehicle((prev) => (prev?.id === vehicleId ? { ...prev!, driver_id: null, driver_name: null, driver_phone: null } : prev))
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

  const assignDriverToVehicle = async (vehicleId: string, driverId: string) => {
    const res = await fetch(`/api/vehicles/${vehicleId}/assign-driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    })
    if (!res.ok) throw new Error('Unable to assign driver')
    await loadVehicles()
  }

  const handleCreateIssue = async () => {
    if (!issueVehicle || !issueTitle.trim()) return
    setIssueSaving(true)
    try {
      const fullDescription = `${
        issueDescription.trim() ? `${issueDescription.trim()}\n\n` : ''
      }Opened by: ${userDisplayName}`

      const { error } = await supabase.from('issues').insert({
        vehicle_id: issueVehicle.id,
        title: issueTitle.trim(),
        description: fullDescription,
        status: 'open',
        priority: issuePriority,
        reported_date: new Date().toISOString().slice(0, 10),
      })
      if (error) throw error

      const vehicleCode = issueVehicle.code
      setShowAddIssueModal(false)
      setIssueVehicle(null)
      await loadVehicles()
      showToast('Issue created', `New issue logged for ${vehicleCode}.`)
    } catch (error: any) {
      showToast('Issue failed', error.message || 'Could not create issue.')
    } finally {
      setIssueSaving(false)
    }
  }

  const toggleHideVehicle = async (vehicleId: string) => {
    try {
      const isHidden = hiddenVehicles.includes(vehicleId)
      let newHiddenVehicles: string[]
      
      if (isHidden) {
        // Unhide
        newHiddenVehicles = hiddenVehicles.filter((id) => id !== vehicleId)
      } else {
        // Hide
        newHiddenVehicles = [...hiddenVehicles, vehicleId]
      }
      
      setHiddenVehicles(newHiddenVehicles)
      
      // Save to user metadata
      const { error } = await supabase.auth.updateUser({
        data: { hidden_vehicles: newHiddenVehicles }
      })
      
      if (error) throw error
      
      // If we're on the hidden filter and unhiding the last vehicle, switch to 'all'
      if (statusFilter === 'hidden' && newHiddenVehicles.length === 0) {
        setStatusFilter('all')
      }
      
      showToast(
        isHidden ? 'Vehicle shown' : 'Vehicle hidden',
        `Vehicle ${isHidden ? 'will now appear' : 'has been hidden'} in your list.`
      )
    } catch (error: any) {
      console.error('Error toggling vehicle visibility:', error)
      showToast('Error', 'Failed to update vehicle visibility.')
      // Revert on error
      setHiddenVehicles(hiddenVehicles)
    }
  }

  const canAddVehicle = vehicles.length < TIER_CONFIG[tier].maxVehicles

  const totalCount = filteredVehicles.length
  const activeCount = filteredVehicles.filter((v) => (v.status || 'active') === 'active').length
  const overdueCount = filteredVehicles.filter((v) => {
    const due = v.oil_change_due_mileage ?? 0
    const current = v.current_mileage ?? 0
    return due > 0 && current >= due
  }).length
  const inShopCount = filteredVehicles.filter((v) => v.status === 'in_shop').length

  if (loading) {
    return (
      <div className="px-4 md:px-6 pt-6 pb-4">
        <div className="mb-6">
          <div className="skeleton h-4 w-24 rounded mb-2" />
          <div className="skeleton h-8 w-48 rounded mb-1" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-glass px-4 py-3 rounded-xl">
              <div className="skeleton h-3 w-12 rounded mb-2" />
              <div className="skeleton h-6 w-10 rounded" />
            </div>
          ))}
        </div>
        <div className="relative mb-4">
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
        <div className="mx-4 md:mx-6 card-glass rounded-2xl overflow-hidden">
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
                <div className="flex-1" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const oilOverdueAlerts = filteredVehicles.filter((v) => {
    const due = v.oil_change_due_mileage ?? 0
    const current = v.current_mileage ?? 0
    return due > 0 && current >= due
  }).slice(0, 10)
  const kpiCards = [
    { label: 'Total vehicles', value: totalCount, delta: null, color: { text: 'text-white', bg: 'bg-white/10' }, icon: Truck },
    { label: 'Active', value: activeCount, delta: null, color: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' }, icon: CheckCircle },
    { label: 'Oil overdue', value: overdueCount, delta: null, color: { text: 'text-amber-400', bg: 'bg-amber-500/10' }, icon: AlertTriangle },
    { label: 'In shop', value: inShopCount, delta: null, color: { text: 'text-blue-400', bg: 'bg-blue-500/10' }, icon: Wrench },
  ]
  const recentInspections: { id: string; vehicle: string; type: string; driver: string; passed: boolean }[] = []

  return (
    <div className="min-h-screen bg-[#0A0F1E] overflow-x-hidden">
      <div className="px-4 md:px-6 py-6 page-enter">
        {/* Welcome header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot active" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Fleet is operational</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Good morning, {userDisplayName}</h1>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s what&apos;s happening with your fleet today.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {kpiCards.map(({ label, value, delta, color, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-glass p-4 sm:p-5 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.bg}`}>
                  <Icon size={14} className={color.text} />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-mono font-bold ${color.text} mb-1`}>{value}</div>
              {delta != null && <div className="text-xs text-slate-500">{delta}</div>}
            </motion.div>
          ))}
        </div>

        {/* Two column: Alerts + Recent inspections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                Active alerts
              </h2>
              <span className={`badge badge-warning text-xs ${oilOverdueAlerts.length > 0 && overdueCount / Math.max(1, filteredVehicles.length) > 0.3 ? 'animate-[glow-pulse_2s_ease-in-out_infinite]' : ''}`}>
                {oilOverdueAlerts.length} open
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {oilOverdueAlerts.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">No active alerts.</div>
              ) : (
                oilOverdueAlerts.map((v) => (
                  <div key={v.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                    <span className="status-dot danger mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{v.code}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Oil change overdue · {(v.current_mileage ?? 0).toLocaleString()} mi</div>
                    </div>
                    <button type="button" onClick={() => openVehiclePanel(v)} className="text-[11px] text-blue-400 hover:text-blue-300 flex-shrink-0">View</button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardCheck size={15} className="text-blue-400" />
                Recent inspections
              </h2>
              <Link href="/dashboard/inspections" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentInspections.length === 0 ? (
                <div className="px-5 py-6 text-sm text-slate-500">No inspections yet.</div>
              ) : (
                recentInspections.map((insp) => (
                  <div key={insp.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${insp.passed ? 'bg-emerald-500/60' : 'bg-red-500/60'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{insp.vehicle}</div>
                      <div className="text-xs text-slate-400">{insp.type} · {insp.driver}</div>
                    </div>
                    <span className={`badge ${insp.passed ? 'badge-active' : 'badge-danger'}`}>{insp.passed ? 'Passed' : 'Failed'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Fleet Overview header + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="status-dot active" />
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Live fleet</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Fleet Overview</h2>
            <p className="text-sm text-slate-400 mt-0.5">{vehicles.length} vehicles · {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              disabled={!TIER_CONFIG[tier].features.csvImport}
              className="btn-ghost text-sm flex items-center gap-2 px-3 py-2 min-h-[44px]"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Import CSV</span>
            </button>
            {canAddVehicle ? (
              <Link href="/dashboard/vehicles/new" className="btn-primary text-sm flex items-center gap-2 px-4 py-2 min-h-[44px]">
                <Plus size={14} />
                Add Vehicle
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => showToast('Vehicle limit reached', `Your ${tier} tier supports up to ${TIER_CONFIG[tier].maxVehicles} vehicles.`)}
                className="btn-ghost text-sm flex items-center gap-2 px-4 py-2 min-h-[44px] opacity-60 cursor-not-allowed"
              >
                <Plus size={14} />
                Add Vehicle
              </button>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                aria-label="Clear search"
              >
                <span className="text-xs">&times;</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-4">
          {(['all', 'New York', 'DMV', 'Other'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTerritoryFilter(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
                territoryFilter === tab
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {tab === 'all' ? 'All' : tab}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['all', 'active', 'out_of_service', 'in_shop'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
                statusFilter === value
                  ? value === 'all'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : value === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : value === 'out_of_service'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {value === 'all' ? 'All' : value === 'out_of_service' ? 'Out of Service' : value === 'in_shop' ? 'In Shop' : 'Active'}
            </button>
          ))}
          {hiddenVehicles.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'hidden' ? 'all' : 'hidden')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
                statusFilter === 'hidden'
                  ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              Hidden ({hiddenVehicles.length})
            </button>
          )}
          <span className="text-xs text-slate-500 mr-1 ml-2">Sort:</span>
          <button
            type="button"
            onClick={() => handleSort('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
              sortField === 'code' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            Truck # {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('current_mileage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
              sortField === 'current_mileage' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            Mileage {sortField === 'current_mileage' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            type="button"
            onClick={() => handleSort('oil_status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-h-[44px] ${
              sortField === 'oil_status' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            Oil Status {sortField === 'oil_status' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <div className="flex-1" />
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/[0.08] min-h-[44px] ${
                viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                showFilters || groupFilter.length > 0 || typeFilter.length > 0 || oilFilter.length > 0 || issuesFilter.length > 0 || docsFilter.length > 0
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(groupFilter.length > 0 || typeFilter.length > 0 || oilFilter.length > 0 || issuesFilter.length > 0 || docsFilter.length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 rounded text-[10px]">
                  {groupFilter.length + typeFilter.length + oilFilter.length + issuesFilter.length + docsFilter.length}
                </span>
              )}
            </button>
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[500px] max-w-[500px] bg-[#0F1629] rounded-xl shadow-2xl border border-white/[0.1] p-4 sm:p-5 z-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Filter Options</h3>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Group</label>
                        <div className="space-y-2">
                          {['New York', 'DMV'].map((group) => (
                            <label key={group} className="flex items-center gap-2.5 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={groupFilter.includes(group)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setGroupFilter([...groupFilter, group])
                                    } else {
                                      setGroupFilter(groupFilter.filter((g) => g !== group))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  groupFilter.includes(group)
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                }`}>
                                  {groupFilter.includes(group) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                {group}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Oil Status</label>
                        <div className="space-y-2">
                          {[
                            { value: 'ok', label: 'Oil OK' },
                            { value: 'overdue', label: 'Oil Overdue' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={oilFilter.includes(option.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setOilFilter([...oilFilter, option.value])
                                    } else {
                                      setOilFilter(oilFilter.filter((o) => o !== option.value))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  oilFilter.includes(option.value)
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                }`}>
                                  {oilFilter.includes(option.value) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Documents</label>
                        <div className="space-y-2">
                          {[
                            { value: 'with_docs', label: 'With Documents' },
                            { value: 'expired_docs', label: 'Expired Documents' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={docsFilter.includes(option.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDocsFilter([...docsFilter, option.value])
                                    } else {
                                      setDocsFilter(docsFilter.filter((d) => d !== option.value))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  docsFilter.includes(option.value)
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                }`}>
                                  {docsFilter.includes(option.value) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Type</label>
                        <div className="space-y-2">
                          {['van', 'truck', 'suv', 'other'].map((type) => (
                            <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={typeFilter.includes(type)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTypeFilter([...typeFilter, type])
                                    } else {
                                      setTypeFilter(typeFilter.filter((t) => t !== type))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  typeFilter.includes(type)
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                }`}>
                                  {typeFilter.includes(type) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors capitalize">
                                {type}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2.5">Issues</label>
                        <div className="space-y-2">
                          {[
                            { value: 'with_issues', label: 'With Issues' },
                            { value: 'no_issues', label: 'No Issues' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={issuesFilter.includes(option.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setIssuesFilter([...issuesFilter, option.value])
                                    } else {
                                      setIssuesFilter(issuesFilter.filter((i) => i !== option.value))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  issuesFilter.includes(option.value)
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                }`}>
                                  {issuesFilter.includes(option.value) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setGroupFilter([])
                      setTypeFilter([])
                      setOilFilter([])
                      setIssuesFilter([])
                      setDocsFilter([])
                    }}
                    className="w-full mt-5 px-4 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

        {viewMode === 'list' && (
          <div className="mx-4 md:mx-6 card-glass rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {filteredVehicles.map((vehicle, index) => {
                const current = vehicle.current_mileage ?? 0
                const due = vehicle.oil_change_due_mileage ?? 0
                const oilOverdueMiles = due > 0 && current >= due ? current - due : 0
                const milesUntilOil = due > 0 ? due - current : 0
                const OIL_DUE_SOON_MI = 500
                const borderClass =
                  oilOverdueMiles > 0
                    ? 'border-l-red-500'
                    : milesUntilOil > 0 && milesUntilOil <= OIL_DUE_SOON_MI
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500'
                const ymm = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
                const issueCount = vehicle.open_issues_count ?? 0
                const overdueK =
                  oilOverdueMiles >= 1000
                    ? `+${(oilOverdueMiles / 1000).toFixed(1)}k mi overdue`
                    : `+${oilOverdueMiles.toLocaleString()} mi overdue`
                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    onClick={() => openVehiclePanel(vehicle)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openVehiclePanel(vehicle)
                      }
                    }}
                    className={`group flex items-center gap-3 px-4 py-3 border-l-[3px] ${borderClass} border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-all duration-150 cursor-pointer ${lastVehicleId === vehicle.id ? 'ring-1 ring-inset ring-blue-500/20' : ''}`}
                  >
                    <div className="font-mono font-bold text-white text-sm w-16 flex-shrink-0 tabular-nums">
                      {vehicle.code}
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-500 truncate">{ymm || '—'}</div>
                        {vehicle.driver_name ? (
                          <div className="text-xs text-slate-400 truncate mt-0.5">{vehicle.driver_name}</div>
                        ) : (
                          <div className="text-xs text-slate-500 italic mt-0.5">Unassigned</div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-white/[0.08] text-slate-400 flex-shrink-0">
                        {getTerritory(vehicle)}
                      </span>
                      {issueCount > 0 && (
                        <span className="badge badge-warning text-[10px] whitespace-nowrap flex-shrink-0">
                          ⚠ {issueCount} issue{issueCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                        {current.toLocaleString()} mi
                      </span>
                      <span className="text-slate-600 hidden sm:inline">|</span>
                      {oilOverdueMiles > 0 ? (
                        <span className="text-[10px] font-semibold font-mono text-red-400 whitespace-nowrap">{overdueK}</span>
                      ) : milesUntilOil > 0 && milesUntilOil <= OIL_DUE_SOON_MI ? (
                        <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap">
                          Due in {milesUntilOil.toLocaleString()} mi
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-400 whitespace-nowrap">Oil OK</span>
                      )}
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Card view — expanded layout */}
        <div className={`${viewMode === 'cards' ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          {filteredVehicles.map((vehicle) => {
            const oilStatus = getOilStatus(vehicle)
            const oilBorder = oilStatus.status === 'overdue' ? 'border-l-2 border-l-red-500/40' : 'border-l-2 border-l-emerald-500/40'
            return (
              <article
                key={vehicle.id}
                onClick={() => openVehiclePanel(vehicle)}
                className={`group relative card-glass p-4 sm:p-5 hover:border-blue-500/20 transition-all duration-200 cursor-pointer ${oilBorder}`}
              >
                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-display font-semibold text-gray-900 dark:text-white transition-colors">
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
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        {getTerritory(vehicle)} • <span className="px-2 py-0.5 rounded-md bg-white/[0.06] dark:bg-gray-700/50 text-xs text-slate-400 uppercase">{vehicle.vehicle_type}</span>
                      </p>
                      {((plateMap[vehicle.code?.toLowerCase() ?? ''] ?? vehicle.license_plate) || '').trim() && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 font-mono mt-1">
                          {(plateMap[vehicle.code?.toLowerCase() ?? ''] ?? vehicle.license_plate)?.trim()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleHideVehicle(vehicle.id)
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            hiddenVehicles.includes(vehicle.id)
                              ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title={hiddenVehicles.includes(vehicle.id) ? 'Show vehicle' : 'Hide vehicle'}
                        >
                          {hiddenVehicles.includes(vehicle.id) ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
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
                      </div>
                      <span
                        className={`badge ${getVehicleStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {getVehicleStatusLabel(vehicle.status)}
                      </span>
                      <span className={oilStatus.status === 'overdue' ? 'badge badge-danger' : 'badge badge-active'}>
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
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {(vehicle.current_mileage ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Oil Change Due
                      </span>
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {(vehicle.oil_change_due_mileage ?? 0).toLocaleString()}
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
                      openVehiclePanel(vehicle)
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
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={closeQuickEdit}
        >
          {/* Wrapper with buffer: clicks in the padding (up to ~2rem outside modal) don't close */}
          <div
            className="flex items-center justify-center w-full max-w-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                quickClosing ? 'animate-quick-edit-close' : 'animate-fade-in-scale'
              }`}
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
                onClick={closeQuickEdit}
                className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={quickSaving}
                className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium py-2.5 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {quickSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-3 sm:right-5 bottom-3 sm:bottom-5 z-[60] max-w-[calc(100vw-1.5rem)]">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
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
              Opened by {userDisplayName} • Status will default to Open
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              CSV should have columns: code, make, model, year, current_mileage, oil_change_due_mileage, license_plate, vin, notes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Note: If your CSV only has state abbreviations (e.g., "FL", "MT") in the license_plate column, you can update the full plate numbers later using the Edit button on each vehicle.
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
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
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
                onClick={handleCancelClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      <VehiclePanel
        vehicle={selectedVehicle}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        allDrivers={allDrivers}
        onAssignDriver={async (vehicleId, driverId) => {
          await assignDriverToVehicle(vehicleId, driverId)
          showToast('Driver assigned', `Assigned driver to ${selectedVehicle?.code ?? 'vehicle'}.`)
          setSelectedVehicle((prev) => (prev ? { ...prev, driver_id: driverId, driver_name: allDrivers.find((d) => d.id === driverId)?.name ?? null } : null))
        }}
        onUnassignDriver={unassignDriverFromVehicle}
      />
    </div>
  )
}
