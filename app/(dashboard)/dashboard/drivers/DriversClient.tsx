'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { getUserDisplayName } from '@/lib/user-utils'
import { Check } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Driver {
  id: string
  user_id?: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  license_number: string | null
  license_expiration: string | null
  notes: string | null
  active: boolean
  hire_date: string | null
  signed_citation_policy: boolean
  location: string | null
  is_ny_driver?: boolean | null
  is_dmv_driver?: boolean | null
  assigned_vehicle_id?: string | null
}

interface Writeup {
  id: string
  driver_id: string
  tier: 'tier1' | 'tier2' | 'tier3'
  reason: string
  created_at: string
  created_by: string | null
}

const DRIVER_LOCATIONS = [
  'New York',
  'DMV',
  'Other',
] as const

type ToastState = {
  title: string
  message: string
  dismissing: boolean
}

export default function DriversClient({ companyId }: { companyId?: string }) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [showWriteupsModal, setShowWriteupsModal] = useState(false)
  const [selectedDriverForWriteups, setSelectedDriverForWriteups] = useState<Driver | null>(null)
  const [writeups, setWriteups] = useState<Writeup[]>([])
  const [newWriteupTier, setNewWriteupTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier3')
  const [newWriteupReason, setNewWriteupReason] = useState('')
  const [writeupSaving, setWriteupSaving] = useState(false)
  const [userDisplayName, setUserDisplayName] = useState<string>('Unknown user')
  const [showDeleteWriteupModal, setShowDeleteWriteupModal] = useState(false)
  const [writeupToDelete, setWriteupToDelete] = useState<string | null>(null)
  const [writeupDirty, setWriteupDirty] = useState(false)
  const [showUnsavedWriteupModal, setShowUnsavedWriteupModal] = useState(false)
  const [driverWriteupCount, setDriverWriteupCount] = useState<Record<string, number>>({})
  const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null)
  const [dragOverLocation, setDragOverLocation] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiration: '',
    notes: '',
    active: true,
    hire_date: '',
    signed_citation_policy: false,
    location: '',
    is_ny_driver: false,
    is_dmv_driver: false,
  })
  const [toast, setToast] = useState<ToastState | null>(null)
  const supabase = createClient()
  const { confirm } = useConfirm()

  const [driverAdminFlags, setDriverAdminFlags] = useState<Record<string, boolean>>({})
  const [adminFlagsLoading, setAdminFlagsLoading] = useState(false)
  const [togglingAdminByEmail, setTogglingAdminByEmail] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadDrivers()
    loadUser()
  }, [])

  const loadAdminFlags = async (driverList?: Driver[]) => {
    try {
      setAdminFlagsLoading(true)
      const list = driverList ?? drivers
      const emails = (list || [])
        .map((d) => d.email?.toLowerCase() ?? '')
        .filter(Boolean)
      if (!emails.length) {
        setDriverAdminFlags({})
        return
      }

      const res = await fetch('/api/driver-admin-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })

      const data = (await res.json().catch(() => ({}))) as { flags?: Record<string, boolean> }
      setDriverAdminFlags(data?.flags ?? {})
    } catch {
      setDriverAdminFlags({})
    } finally {
      setAdminFlagsLoading(false)
    }
  }

  const loadWriteupCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_writeups')
        .select('driver_id')
      if (error) throw error
      const counts: Record<string, number> = {}
      ;(data || []).forEach((row: { driver_id: string }) => {
        counts[row.driver_id] = (counts[row.driver_id] || 0) + 1
      })
      setDriverWriteupCount(counts)
    } catch {
      setDriverWriteupCount({})
    }
  }

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserDisplayName(getUserDisplayName(user))
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

  const getLicenseStatus = (expirationDate: string | null): { status: 'valid' | 'expiring' | 'expired'; color: string; icon: string } => {
    if (!expirationDate) {
      return { status: 'expired', color: 'text-gray-400', icon: '○' }
    }
    
    const expiration = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-500', icon: '●' }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'text-yellow-500', icon: '●' }
    } else {
      return { status: 'valid', color: 'text-green-500', icon: '●' }
    }
  }

  // Group drivers by location
  const groupDriversByLocation = () => {
    const grouped: Record<string, Driver[]> = {}
    
    drivers.forEach((driver) => {
      const location = driver.location || 'Unassigned'
      if (!grouped[location]) {
        grouped[location] = []
      }
      grouped[location].push(driver)
    })
    
    // Sort locations alphabetically, but put "Unassigned" at the end
    const sortedLocations = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unassigned') return 1
      if (b === 'Unassigned') return -1
      return a.localeCompare(b)
    })
    
    return { grouped, sortedLocations }
  }

  const loadDrivers = async () => {
    try {
      let query = supabase.from('drivers').select('*').order('last_name', { ascending: true })
      if (companyId) query = query.eq('company_id', companyId)
      const { data, error } = await query
      if (error) throw error
      setDrivers(data || [])
      // Fetch admin/driver toggle state for each driver email.
      await loadAdminFlags(data || [])
      await loadWriteupCounts()
    } catch (error) {
      console.error('Error loading drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        license_expiration: formData.license_expiration || null,
        hire_date: formData.hire_date || null,
        location: formData.location || null,
        is_ny_driver: !!formData.is_ny_driver,
        is_dmv_driver: !!formData.is_dmv_driver,
        ...(companyId && !editingDriver && { company_id: companyId }),
      }

      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update(submitData)
          .eq('id', editingDriver.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('drivers').insert([submitData])
        if (error) throw error
      }

      setShowModal(false)
      setEditingDriver(null)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        license_number: '',
        license_expiration: '',
        notes: '',
        active: true,
        hire_date: '',
        signed_citation_policy: false,
        location: '',
        is_ny_driver: false,
        is_dmv_driver: false,
      })
      loadDrivers()
      showToast(
        editingDriver ? 'Driver updated' : 'Driver added',
        `${formData.first_name} ${formData.last_name} was ${editingDriver ? 'updated' : 'added'} successfully.`
      )
    } catch (error: any) {
      console.error('Error saving driver:', error)
      showToast('Save failed', error.message || 'Unable to save driver. Please try again.')
    }
  }

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setFormData({
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_expiration: driver.license_expiration || '',
      notes: driver.notes || '',
      active: driver.active,
      hire_date: driver.hire_date || '',
      signed_citation_policy: driver.signed_citation_policy || false,
      location: driver.location || '',
      is_ny_driver: !!driver.is_ny_driver,
      is_dmv_driver: !!driver.is_dmv_driver,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const driver = drivers.find((d) => d.id === id)
    const confirmed = await confirm({
      title: 'Delete driver?',
      description: `This will permanently remove ${driver?.first_name || 'this'} ${driver?.last_name || 'driver'}.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id)
      if (error) throw error
      loadDrivers()
      showToast('Driver deleted', `${driver?.first_name} ${driver?.last_name} was removed successfully.`)
    } catch (error: any) {
      console.error('Error deleting driver:', error)
      showToast('Delete failed', error.message || 'Unable to delete driver. Please try again.')
    }
  }

  const toggleDriverAdmin = async (driverEmail: string, nextIsAdmin: boolean) => {
    const email = driverEmail.trim().toLowerCase()
    if (!email) return

    setTogglingAdminByEmail((prev) => ({ ...prev, [email]: true }))
    try {
      const res = await fetch('/api/driver-admin-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isAdmin: nextIsAdmin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast('Update failed', data?.error || 'Unable to update admin access.')
        return
      }

      // Refresh local admin flags so the UI immediately reflects the toggle.
      await loadAdminFlags()
      showToast('Access updated', nextIsAdmin ? 'Admin access enabled.' : 'Driver access enabled.')
    } catch (e: any) {
      showToast('Update failed', e?.message || 'Unable to update admin access.')
    } finally {
      setTogglingAdminByEmail((prev) => ({ ...prev, [email]: false }))
    }
  }

  const openWriteupsModal = async (driver: Driver) => {
    setSelectedDriverForWriteups(driver)
    setShowWriteupsModal(true)
    await loadWriteups(driver.id)
  }

  const loadWriteups = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_writeups')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWriteups(data || [])
    } catch (error) {
      console.error('Error loading writeups:', error)
      setWriteups([])
    }
  }

  const handleAddWriteup = async () => {
    if (!selectedDriverForWriteups || !newWriteupReason.trim()) return

    setWriteupSaving(true)
    try {
      const { error } = await supabase
        .from('driver_writeups')
        .insert({
          driver_id: selectedDriverForWriteups.id,
          tier: newWriteupTier,
          reason: newWriteupReason.trim(),
          created_by: userDisplayName,
        })

      if (error) throw error

      setNewWriteupReason('')
      setNewWriteupTier('tier3')
      setWriteupDirty(false)
      await loadWriteups(selectedDriverForWriteups.id)
      setDriverWriteupCount((prev) => ({
        ...prev,
        [selectedDriverForWriteups.id]: (prev[selectedDriverForWriteups.id] || 0) + 1,
      }))
      showToast('Writeup added', `Writeup added for ${selectedDriverForWriteups.first_name} ${selectedDriverForWriteups.last_name}.`)
    } catch (error: any) {
      console.error('Error adding writeup:', error)
      showToast('Error', error.message || 'Failed to add writeup.')
    } finally {
      setWriteupSaving(false)
    }
  }

  const handleDeleteWriteupClick = (writeupId: string) => {
    setWriteupToDelete(writeupId)
    setShowDeleteWriteupModal(true)
  }

  const handleConfirmDeleteWriteup = async () => {
    if (!writeupToDelete) return

    try {
      const { error } = await supabase
        .from('driver_writeups')
        .delete()
        .eq('id', writeupToDelete)

      if (error) throw error

      if (selectedDriverForWriteups) {
        await loadWriteups(selectedDriverForWriteups.id)
        setDriverWriteupCount((prev) => ({
          ...prev,
          [selectedDriverForWriteups.id]: Math.max(0, (prev[selectedDriverForWriteups.id] || 1) - 1),
        }))
      }
      showToast('Writeup deleted', 'Writeup removed successfully.')
      setShowDeleteWriteupModal(false)
      setWriteupToDelete(null)
    } catch (error: any) {
      console.error('Error deleting writeup:', error)
      showToast('Error', error.message || 'Failed to delete writeup.')
      setShowDeleteWriteupModal(false)
      setWriteupToDelete(null)
    }
  }

  const handleCancelDeleteWriteup = () => {
    setShowDeleteWriteupModal(false)
    setWriteupToDelete(null)
  }

  const handleCloseWriteupsModal = () => {
    setShowWriteupsModal(false)
    setSelectedDriverForWriteups(null)
    setWriteups([])
    setNewWriteupReason('')
    setNewWriteupTier('tier3')
    setWriteupDirty(false)
  }

  const updateDriverLocation = async (driverId: string, newLocation: string | null) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ location: newLocation })
        .eq('id', driverId)
      if (error) throw error
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, location: newLocation } : d))
      )
      showToast('Driver moved', 'Driver location updated.')
    } catch (e: any) {
      showToast('Error', e?.message || 'Failed to update driver location.')
    }
  }

  const handleDragStart = (e: React.DragEvent, driverId: string) => {
    e.dataTransfer.setData('application/driver-id', driverId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedDriverId(driverId)
  }

  const handleDragEnd = () => {
    setDraggedDriverId(null)
    setDragOverLocation(null)
  }

  const handleDragOver = (e: React.DragEvent, location: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverLocation(location)
  }

  const handleDragLeave = () => {
    setDragOverLocation(null)
  }

  const handleDrop = (e: React.DragEvent, targetLocation: string) => {
    e.preventDefault()
    setDragOverLocation(null)
    setDraggedDriverId(null)
    const driverId = e.dataTransfer.getData('application/driver-id')
    if (!driverId) return
    const newLocation = targetLocation === 'Unassigned' ? null : targetLocation
    const driver = drivers.find((d) => d.id === driverId)
    if (driver && (driver.location || 'Unassigned') !== targetLocation) {
      updateDriverLocation(driverId, newLocation)
    }
  }

  const handleConfirmCloseWriteupsModal = () => {
    setShowUnsavedWriteupModal(false)
    handleCloseWriteupsModal()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading drivers...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drivers</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your fleet drivers
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Cards
              </button>
            </div>
            <button
              onClick={() => {
                setEditingDriver(null)
                setFormData({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  license_number: '',
                  license_expiration: '',
                  notes: '',
                  active: true,
                  hire_date: '',
                  signed_citation_policy: false,
                  location: '',
                  is_ny_driver: false,
                  is_dmv_driver: false,
                })
                setShowModal(true)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
            >
              Add Driver
            </button>
          </div>
        </div>

        {/* List View - Desktop */}
        {viewMode === 'list' && (() => {
          const { grouped, sortedLocations } = groupDriversByLocation()
          
          return (
            <>
            {/* Desktop Table View */}
            <div className="hidden md:block space-y-6">
              {sortedLocations.map((location) => (
                <div key={location} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 shadow-md">
                  {/* Location Header - slim, drop target */}
                  <div
                    onDragOver={(e) => handleDragOver(e, location)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, location)}
                    className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2 transition-colors ${
                      dragOverLocation === location
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400 dark:ring-indigo-500'
                        : 'bg-gray-50/80 dark:bg-gray-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{location}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({grouped[location].length})
                      </span>
                    </div>
                  </div>
                  
                  {/* Drivers Table */}
                  <div className="max-h-[calc(100dvh-400px)] overflow-y-auto overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                      <table className="w-full text-[13px] min-w-[800px] sm:min-w-0">
                      <thead className="bg-gray-50 dark:bg-gray-900/60 sticky top-0 z-10">
                        <tr className="text-left text-xs tracking-wide text-gray-500 dark:text-gray-400">
                          <th className="w-9 px-1 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60" aria-label="Drag" />
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Driver</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Email</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Phone</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">License</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">License Status</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Hire Date</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Status</th>
                          <th className="px-4 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60">Citation Policy</th>
                          <th className="px-3 py-2 border-r border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/60 text-center">Admin</th>
                          <th className="px-4 py-2 bg-gray-50 dark:bg-gray-900/60 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {grouped[location].map((driver) => {
                          const licenseStatus = getLicenseStatus(driver.license_expiration)
                          const writeupCount = driverWriteupCount[driver.id] ?? 0
                          return (
                            <tr
                              key={driver.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, driver.id)}
                              onDragEnd={handleDragEnd}
                              className={`text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${draggedDriverId === driver.id ? 'opacity-50' : ''}`}
                            >
                              <td className="w-9 px-1 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap cursor-grab active:cursor-grabbing">
                                <span className="inline-flex p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-hidden title="Drag to move driver">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" /></svg>
                                </span>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {driver.first_name} {driver.last_name}
                                </p>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {driver.email || 'N/A'}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {driver.phone || 'N/A'}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {driver.license_number || 'N/A'}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {driver.license_expiration ? (
                                    <>
                                      <span className={`text-lg ${licenseStatus.color}`} title={
                                        licenseStatus.status === 'expired' 
                                          ? 'License expired' 
                                          : licenseStatus.status === 'expiring' 
                                          ? 'License expiring within 30 days' 
                                          : 'License valid'
                                      }>
                                        {licenseStatus.icon}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-200 text-xs">
                                        {new Date(driver.license_expiration).toLocaleDateString()}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {driver.hire_date ? new Date(driver.hire_date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    driver.active
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {driver.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap">
                                <span
                                  className={`text-xs font-medium ${
                                    driver.signed_citation_policy ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                  }`}
                                >
                                  {driver.signed_citation_policy ? '✓ Signed' : '✗ Not signed'}
                                </span>
                              </td>
                              <td className="px-3 py-3 border-r border-gray-200/50 dark:border-gray-700/50 whitespace-nowrap text-center">
                                {driver.email && (() => {
                                  const emailKey = driver.email!.toLowerCase()
                                  const isAdmin = driverAdminFlags[emailKey] ?? false
                                  const isUpdating = togglingAdminByEmail[emailKey] ?? false
                                  return (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Admin</span>
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isAdmin}
                                        disabled={isUpdating}
                                        onClick={() => toggleDriverAdmin(emailKey, !isAdmin)}
                                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                                          isAdmin ? 'bg-emerald-500/20' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                            isAdmin ? 'translate-x-5' : 'translate-x-0.5'
                                          }`}
                                        />
                                        <span className="sr-only">{isAdmin ? 'Admin on' : 'Admin off'}</span>
                                      </button>
                                    </div>
                                  )
                                })()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex gap-2 justify-center items-center">
                                  <button
                                    onClick={() => handleEdit(driver)}
                                    className="px-3 py-1 rounded-md text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openWriteupsModal(driver)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                                  >
                                    Writeups
                                    {writeupCount > 0 && (
                                      <span className="min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-amber-500/90 text-white text-[10px] font-bold">
                                        {writeupCount}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(driver.id)}
                                    className="px-3 py-1 rounded-md text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                                  >
                                    Delete
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
                </div>
              ))}
            </div>
            
            {/* Mobile List View */}
            <div className="md:hidden space-y-6">
              {sortedLocations.map((location) => (
                <div key={location} className="space-y-3">
                  {/* Location Header - slim, drop target */}
                  <div
                    onDragOver={(e) => handleDragOver(e, location)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, location)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      dragOverLocation === location
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{location}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({grouped[location].length})</span>
                  </div>
                  
                  {/* Mobile Driver List Items */}
                  <div className="space-y-3">
                    {grouped[location].map((driver) => {
                      const licenseStatus = getLicenseStatus(driver.license_expiration)
                      const writeupCount = driverWriteupCount[driver.id] ?? 0
                      return (
                        <div
                          key={driver.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, driver.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 space-y-3 ${draggedDriverId === driver.id ? 'opacity-50' : ''}`}
                        >
                          {/* Driver Name and Status */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-1 text-gray-400" aria-label="Drag to move">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" /></svg>
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                {driver.first_name} {driver.last_name}
                              </h3>
                              {driver.email && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{driver.email}</p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                                driver.active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {driver.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          {/* Driver Details Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {driver.phone || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">License</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {driver.license_number || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">License Status</p>
                              <div className="flex items-center gap-1">
                                {driver.license_expiration ? (
                                  <>
                                    <span className={`text-base ${licenseStatus.color}`}>
                                      {licenseStatus.icon}
                                    </span>
                                    <span className="text-xs text-gray-700 dark:text-gray-200">
                                      {new Date(driver.license_expiration).toLocaleDateString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hire Date</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {driver.hire_date ? new Date(driver.hire_date).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Admin toggle */}
                          {driver.email && (
                            (() => {
                              const emailKey = driver.email!.toLowerCase()
                              const isAdmin = driverAdminFlags[emailKey] ?? false
                              const isUpdating = togglingAdminByEmail[emailKey] ?? false
                              return (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Admin</span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isAdmin}
                                    disabled={!driver.email || isUpdating}
                                    onClick={() => toggleDriverAdmin(emailKey, !isAdmin)}
                                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                                      isAdmin ? 'bg-emerald-500/20' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                        isAdmin ? 'translate-x-5' : 'translate-x-0.5'
                                      }`}
                                    />
                                    <span className="sr-only">{isAdmin ? 'Admin on' : 'Admin off'}</span>
                                  </button>
                                </div>
                              )
                            })()
                          )}
                          
                          {/* Citation Policy */}
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Citation Policy</span>
                              <span
                                className={`text-xs font-medium ${
                                  driver.signed_citation_policy ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                }`}
                              >
                                {driver.signed_citation_policy ? '✓ Signed' : '✗ Not signed'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => handleEdit(driver)}
                              className="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openWriteupsModal(driver)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                            >
                              Writeups
                              {writeupCount > 0 && (
                                <span className="min-w-[1.1rem] h-4 px-1 inline-flex items-center justify-center rounded-full bg-amber-500/90 text-white text-[10px] font-bold">
                                  {writeupCount}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(driver.id)}
                              className="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            </>
          )
        })()}

        {/* Card View */}
        {viewMode === 'cards' && (() => {
          const { grouped, sortedLocations } = groupDriversByLocation()
          
          return (
            <div className="space-y-6">
              {sortedLocations.map((location) => (
                <div key={location} className="space-y-4">
                  {/* Location Header - slim, drop target */}
                  <div
                    onDragOver={(e) => handleDragOver(e, location)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, location)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                      dragOverLocation === location
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{location}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({grouped[location].length})</span>
                  </div>
                  
                  {/* Driver Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped[location].map((driver) => {
            const licenseStatus = getLicenseStatus(driver.license_expiration)
            const writeupCount = driverWriteupCount[driver.id] ?? 0
            return (
              <div
                key={driver.id}
                draggable
                onDragStart={(e) => handleDragStart(e, driver.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-grab active:cursor-grabbing ${draggedDriverId === driver.id ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 flex items-start gap-2">
                    <span className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-500 flex-shrink-0 mt-0.5" aria-label="Drag to move">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" /></svg>
                    </span>
                    <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {driver.first_name} {driver.last_name}
                    </h3>
                    {driver.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{driver.email}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          driver.signed_citation_policy ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {driver.signed_citation_policy ? '✓ Citation policy signed' : '✗ Citation policy not signed'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-2 text-xs ${
                          driver.user_id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            driver.user_id ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        />
                        {driver.user_id ? 'Account active' : 'No account'}
                      </span>
                      {!driver.user_id && (
                        <button
                          type="button"
                          className="ml-auto px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                          onClick={() => showToast('Invite', 'Invite flow coming soon.')}
                        >
                          Invite
                        </button>
                      )}
                    </div>

                    {/* Admin toggle */}
                    {driver.email && (
                      (() => {
                        const emailKey = driver.email!.toLowerCase()
                        const isAdmin = driverAdminFlags[emailKey] ?? false
                        const isUpdating = togglingAdminByEmail[emailKey] ?? false
                        return (
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Admin</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isAdmin}
                              disabled={isUpdating}
                              onClick={() => toggleDriverAdmin(emailKey, !isAdmin)}
                              className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
                                isAdmin ? 'bg-emerald-500/20' : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                  isAdmin ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                              <span className="sr-only">{isAdmin ? 'Admin on' : 'Admin off'}</span>
                            </button>
                          </div>
                        )
                      })()
                    )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${
                      driver.active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {driver.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {driver.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{driver.phone}</span>
                    </div>
                  )}
                  {driver.license_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">License:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {driver.license_number}
                      </span>
                    </div>
                  )}
                  {driver.license_expiration && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">License Expires:</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${licenseStatus.color}`} title={
                          licenseStatus.status === 'expired' 
                            ? 'License expired' 
                            : licenseStatus.status === 'expiring' 
                            ? 'License expiring within 30 days' 
                            : 'License valid'
                        }>
                          {licenseStatus.icon}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(driver.license_expiration).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {driver.hire_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Hire Date:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(driver.hire_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(driver)}
                    className="flex-1 min-w-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openWriteupsModal(driver)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/90 hover:bg-amber-600 text-white rounded-md text-sm font-medium"
                  >
                    Writeups
                    {writeupCount > 0 && (
                      <span className="min-w-[1.25rem] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-white/25 text-white text-xs font-bold">
                        {writeupCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(driver.id)}
                    className="flex-1 min-w-0 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
                    )
                  })}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {drivers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No drivers yet. Add your first driver!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => {
            setShowModal(false)
            setEditingDriver(null)
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-2rem)] sm:max-w-3xl w-full mx-2 sm:mx-4 animate-fade-in-scale max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingDriver ? 'Edit Driver' : 'Add Driver'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Expiration
                </label>
                <input
                  type="date"
                  value={formData.license_expiration}
                  onChange={(e) => setFormData({ ...formData, license_expiration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select location...</option>
                  <option value="New York">New York</option>
                  <option value="DMV">DMV (DC/MD/VA)</option>
                  <option value="Other">Other</option>
                </select>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_ny_driver: !formData.is_ny_driver })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.is_ny_driver
                        ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                        : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
                    }`}
                  >
                    New York
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_dmv_driver: !formData.is_dmv_driver })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.is_dmv_driver
                        ? 'bg-violet-500/20 border border-violet-500/40 text-violet-400'
                        : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
                    }`}
                  >
                    DMV
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  These tags filter which drivers appear when assigning to a vehicle.
                </p>
              </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                      formData.active
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                    }`}>
                      {formData.active && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    Active
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.signed_citation_policy}
                      onChange={(e) => setFormData({ ...formData, signed_citation_policy: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center ${
                      formData.signed_citation_policy
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-600 dark:border-indigo-500 shadow-sm'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                    }`}>
                      {formData.signed_citation_policy && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    Signed citation policy
                  </span>
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                >
                  {editingDriver ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingDriver(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Writeups Modal */}
      {showWriteupsModal && selectedDriverForWriteups && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={(e) => {
            // Only handle backdrop clicks, not clicks on child elements
            if (e.target === e.currentTarget) {
              if (writeupDirty) {
                setShowUnsavedWriteupModal(true)
                return
              }
              handleCloseWriteupsModal()
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-2rem)] sm:max-w-3xl w-full mx-2 sm:mx-4 animate-fade-in-scale max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Writeups - {selectedDriverForWriteups.first_name} {selectedDriverForWriteups.last_name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage driver writeups
                </p>
              </div>
              <button
                onClick={() => {
                  if (writeupDirty) {
                    setShowUnsavedWriteupModal(true)
                    return
                  }
                  handleCloseWriteupsModal()
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Add Writeup Form */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add New Writeup</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tier
                  </label>
                  <select
                    value={newWriteupTier}
                    onChange={(e) => setNewWriteupTier(e.target.value as 'tier1' | 'tier2' | 'tier3')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="tier1">Tier 1 - Most Serious (Termination Grounds)</option>
                    <option value="tier2">Tier 2 - Serious</option>
                    <option value="tier3">Tier 3 - Least Serious</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Reason
                  </label>
                  <textarea
                    value={newWriteupReason}
                    onChange={(e) => {
                      setNewWriteupReason(e.target.value)
                      setWriteupDirty(e.target.value.trim().length > 0)
                    }}
                    rows={3}
                    placeholder="Enter the reason for this writeup..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <button
                  onClick={handleAddWriteup}
                  disabled={writeupSaving || !newWriteupReason.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium"
                >
                  {writeupSaving ? 'Adding...' : 'Add Writeup'}
                </button>
              </div>
            </div>

            {/* Writeups List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Writeup History ({writeups.length})
              </h3>
              {writeups.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No writeups recorded for this driver.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {writeups.map((writeup) => {
                    const tierColors = {
                      tier1: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-800',
                      tier2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
                      tier3: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-800',
                    }
                    const tierLabels = {
                      tier1: 'Tier 1 - Most Serious',
                      tier2: 'Tier 2 - Serious',
                      tier3: 'Tier 3 - Least Serious',
                    }
                    return (
                      <div
                        key={writeup.id}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${tierColors[writeup.tier]}`}>
                              {tierLabels[writeup.tier]}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(writeup.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteWriteupClick(writeup.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete writeup"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{writeup.reason}</p>
                        {writeup.created_by && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Recorded by: {writeup.created_by}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Writeup Confirmation Modal */}
      {showDeleteWriteupModal && (
        <div 
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDeleteWriteup()
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Writeup</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this writeup? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDeleteWriteup}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Delete Writeup
              </button>
              <button
                onClick={handleCancelDeleteWriteup}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Writeup Changes Modal */}
      {showUnsavedWriteupModal && (
        <div 
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnsavedWriteupModal(false)
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
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
                onClick={handleConfirmCloseWriteupsModal}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Close Without Saving
              </button>
              <button
                onClick={() => setShowUnsavedWriteupModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-all"
              >
                Cancel
              </button>
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
    </div>
  )
}
