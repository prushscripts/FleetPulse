'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

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

interface ServiceRecord {
  id: string
  date: string
  mileage: number
  service_type: string
  description: string | null
  cost: number | null
  service_provider: string | null
  notes: string | null
}

interface Issue {
  id: string
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'critical'
  reported_date: string
  resolved_date: string | null
}

interface Document {
  id: string
  name: string
  document_type: string
  file_url: string
  expiration_date: string | null
  notes: string | null
}

interface MileageHistory {
  date: string
  mileage: number
  source: string
}

export default function VehicleDetailClient({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [mileageHistory, setMileageHistory] = useState<MileageHistory[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'service' | 'issues' | 'documents'>('details')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadVehicleData()
  }, [vehicleId])

  const loadVehicleData = async () => {
    try {
      // Load vehicle
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (vehicleError) throw vehicleError
      setVehicle({ ...vehicleData, status: vehicleData.status || 'active' })

      // Load drivers
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, first_name, last_name')
        .eq('active', true)
        .order('last_name', { ascending: true })
      setDrivers(driversData || [])

      // Load service records
      const { data: serviceData, error: serviceError } = await supabase
        .from('service_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })

      if (serviceError) throw serviceError
      setServiceRecords(serviceData || [])

      // Load issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('reported_date', { ascending: false })

      if (issuesError) throw issuesError
      setIssues(issuesData || [])

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expiration_date', { ascending: true })

      if (documentsError) throw documentsError
      setDocuments(documentsData || [])

      // Build mileage history from service records and fuel logs
      const { data: fuelLogsData } = await supabase
        .from('fuel_logs')
        .select('date, mileage')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })

      const history: MileageHistory[] = []
      ;(serviceData || []).forEach((record) => {
        history.push({ date: record.date, mileage: record.mileage, source: 'Service' })
      })
      fuelLogsData?.forEach((log) => {
        history.push({ date: log.date, mileage: log.mileage, source: 'Fuel Log' })
      })
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setMileageHistory(history)
    } catch (error) {
      console.error('Error loading vehicle data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!vehicle) return

    const formData = new FormData(e.currentTarget)
    const updates = {
      code: formData.get('code') as string,
      make: formData.get('make') as string || null,
      model: formData.get('model') as string || null,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      current_mileage: parseInt(formData.get('current_mileage') as string),
      oil_change_due_mileage: parseInt(formData.get('oil_change_due_mileage') as string),
      license_plate: formData.get('license_plate') as string || null,
      vin: formData.get('vin') as string || null,
      notes: formData.get('notes') as string || null,
      status: formData.get('status') as string || 'active',
      driver_id: formData.get('driver_id') as string || null,
    }

    try {
      const { error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId)
      if (error) throw error
      setVehicle({ ...vehicle, ...updates })
      setEditing(false)
      loadVehicleData()
    } catch (error: any) {
      alert('Error updating vehicle: ' + error.message)
    }
  }

  const handleAddServiceRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newRecord = {
      vehicle_id: vehicleId,
      date: formData.get('date') as string,
      mileage: parseInt(formData.get('mileage') as string),
      service_type: formData.get('service_type') as string,
      description: formData.get('description') as string || null,
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      service_provider: formData.get('service_provider') as string || null,
      notes: formData.get('notes') as string || null,
    }

    try {
      const { error } = await supabase.from('service_records').insert(newRecord)
      if (error) throw error
      setShowServiceModal(false)
      e.currentTarget.reset()
      loadVehicleData()
    } catch (error: any) {
      alert('Error adding service record: ' + error.message)
    }
  }

  const handleAddIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const newIssue = {
      vehicle_id: vehicleId,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      reported_date: formData.get('reported_date') as string,
    }

    try {
      const { error } = await supabase.from('issues').insert(newIssue)
      if (error) throw error
      setShowIssueModal(false)
      e.currentTarget.reset()
      loadVehicleData()
    } catch (error: any) {
      alert('Error adding issue: ' + error.message)
    }
  }

  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    try {
      const updateData: any = { status }
      if (status === 'resolved') {
        updateData.resolved_date = new Date().toISOString().split('T')[0]
      }
      const { error } = await supabase.from('issues').update(updateData).eq('id', issueId)
      if (error) throw error
      loadVehicleData()
    } catch (error: any) {
      alert('Error updating issue: ' + error.message)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!vehicle) return

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File
    if (!file) {
      alert('Please select a file')
      return
    }

    setUploadingFile(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${vehicleId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName)

      // Save document record
      const { error: insertError } = await supabase.from('documents').insert({
        vehicle_id: vehicleId,
        name: formData.get('name') as string,
        document_type: formData.get('document_type') as string,
        file_url: publicUrl,
        expiration_date: formData.get('expiration_date') as string || null,
        notes: formData.get('notes') as string || null,
      })

      if (insertError) throw insertError

      setShowDocumentModal(false)
      e.currentTarget.reset()
      loadVehicleData()
    } catch (error: any) {
      alert('Error uploading document: ' + error.message)
    } finally {
      setUploadingFile(false)
    }
  }

  const getOilStatus = () => {
    if (!vehicle) return { status: 'ok', color: '' }
    const isOverdue = vehicle.current_mileage >= vehicle.oil_change_due_mileage
    return {
      status: isOverdue ? 'overdue' : 'ok',
      color: isOverdue
        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    }
  }

  const getIssueStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading vehicle...</div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Vehicle not found</p>
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const oilStatus = getOilStatus()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vehicle.code}</h1>
              {vehicle.make && vehicle.model && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-sm font-medium rounded ${oilStatus.color}`}>
                {oilStatus.status === 'overdue' ? 'Oil Overdue' : 'Oil OK'}
              </span>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                >
                  Edit Vehicle
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {(['details', 'service', 'issues', 'documents'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div>
                {editing ? (
                  <form onSubmit={handleUpdateVehicle} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Vehicle Code *
                        </label>
                        <input
                          type="text"
                          name="code"
                          defaultValue={vehicle.code}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Mileage *
                        </label>
                        <input
                          type="number"
                          name="current_mileage"
                          defaultValue={vehicle.current_mileage}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Oil Change Due Mileage *
                        </label>
                        <input
                          type="number"
                          name="oil_change_due_mileage"
                          defaultValue={vehicle.oil_change_due_mileage}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Make
                        </label>
                        <input
                          type="text"
                          name="make"
                          defaultValue={vehicle.make || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          name="model"
                          defaultValue={vehicle.model || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          name="year"
                          defaultValue={vehicle.year || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          License Plate
                        </label>
                        <input
                          type="text"
                          name="license_plate"
                          defaultValue={vehicle.license_plate || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          VIN
                        </label>
                        <input
                          type="text"
                          name="vin"
                          defaultValue={vehicle.vin || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status *
                        </label>
                        <select
                          name="status"
                          defaultValue={vehicle.status || 'active'}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="out_of_service">Out of Service</option>
                          <option value="in_shop">In Shop</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Assigned Driver
                        </label>
                        <select
                          name="driver_id"
                          defaultValue={vehicle.driver_id || ''}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                          <option value="">No Driver Assigned</option>
                          {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.first_name} {driver.last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={vehicle.notes || ''}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Vehicle Information
                      </h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Code:</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.code}</dd>
                        </div>
                        {vehicle.make && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-gray-400">Make:</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.make}</dd>
                          </div>
                        )}
                        {vehicle.model && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-gray-400">Model:</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.model}</dd>
                          </div>
                        )}
                        {vehicle.year && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-gray-400">Year:</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.year}</dd>
                          </div>
                        )}
                        {vehicle.license_plate && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-gray-400">License Plate:</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">
                              {vehicle.license_plate}
                            </dd>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-gray-400">VIN:</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.vin}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Mileage</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Current Mileage:</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.current_mileage.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-gray-400">Oil Change Due:</dt>
                          <dd className="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.oil_change_due_mileage.toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                      {vehicle.notes && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h3>
                          <p className="text-sm text-gray-900 dark:text-white">{vehicle.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mileage History */}
                {mileageHistory.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Mileage History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Mileage
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {mileageHistory.slice(0, 10).map((entry, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {entry.mileage.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {entry.source}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'service' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Service Records</h3>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Add Service Record
                  </button>
                </div>
                {serviceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Mileage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Service Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cost
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Provider
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {serviceRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {format(new Date(record.date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {record.mileage.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {record.service_type}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {record.description || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {record.cost ? `$${record.cost.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {record.service_provider || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No service records yet.</p>
                )}
              </div>
            )}

            {activeTab === 'issues' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Issues</h3>
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Add Issue
                  </button>
                </div>
                {issues.length > 0 ? (
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{issue.title}</h4>
                          <div className="flex gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getIssueStatusColor(issue.status)}`}
                            >
                              {issue.status.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(issue.priority)}`}
                            >
                              {issue.priority}
                            </span>
                          </div>
                        </div>
                        {issue.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{issue.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Reported: {format(new Date(issue.reported_date), 'MMM d, yyyy')}
                          </span>
                          {issue.status !== 'resolved' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateIssueStatus(
                                    issue.id,
                                    issue.status === 'open' ? 'in_progress' : 'resolved'
                                  )
                                }
                                className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                              >
                                {issue.status === 'open' ? 'Start' : 'Resolve'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No issues reported.</p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documents</h3>
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Upload Document
                  </button>
                </div>
                {documents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Expiration Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {documents.map((doc) => {
                          const isExpired =
                            doc.expiration_date && new Date(doc.expiration_date) < new Date()
                          return (
                            <tr key={doc.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {doc.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {doc.document_type}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {doc.expiration_date ? (
                                  <span
                                    className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : ''}
                                  >
                                    {format(new Date(doc.expiration_date), 'MMM d, yyyy')}
                                    {isExpired && ' (Expired)'}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                  View
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No documents uploaded.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Record Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Service Record</h2>
            <form onSubmit={handleAddServiceRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mileage *
                </label>
                <input
                  type="number"
                  name="mileage"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Type *
                </label>
                <input
                  type="text"
                  name="service_type"
                  placeholder="e.g., Oil Change, Tire Rotation"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Provider
                </label>
                <input
                  type="text"
                  name="service_provider"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                >
                  Add Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Issue</h2>
            <form onSubmit={handleAddIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority *
                </label>
                <select
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reported Date *
                </label>
                <input
                  type="date"
                  name="reported_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                >
                  Add Issue
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Upload Document</h2>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Type *
                </label>
                <input
                  type="text"
                  name="document_type"
                  placeholder="e.g., Registration, Insurance, Inspection"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File *
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  name="expiration_date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
