'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface VehicleComment {
  id: string
  comment: string
  author_email: string | null
  created_at: string
}

export default function VehicleDetailClient({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [mileageHistory, setMileageHistory] = useState<MileageHistory[]>([])
  const [drivers, setDrivers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [activeTab, setActiveTab] = useState<'details' | 'service' | 'issues' | 'documents'>('details')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showOilResetModal, setShowOilResetModal] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [resettingOil, setResettingOil] = useState(false)
  const [toast, setToast] = useState<{ title: string; message: string; dismissing: boolean } | null>(null)
  const [comments, setComments] = useState<VehicleComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadVehicleData()
  }, [vehicleId])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'details' || tab === 'service' || tab === 'issues' || tab === 'documents') {
      setActiveTab(tab)
    }
  }, [searchParams])

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

      // Load current user email
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserEmail(user?.email || null)

      // Load comment thread (non-breaking if table doesn't exist yet)
      const { data: commentData, error: commentError } = await supabase
        .from('vehicle_comments')
        .select('id, comment, author_email, created_at')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
      if (!commentError) {
        setComments((commentData as VehicleComment[]) || [])
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicle_comments').insert({
        vehicle_id: vehicleId,
        comment: newComment.trim(),
        author_email: user?.email || null,
      })
      if (error) throw error
      setNewComment('')
      await loadVehicleData()
    } catch (error: any) {
      setToast({
        title: 'Comment failed',
        message: error.message || 'Could not post comment.',
        dismissing: false,
      })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
    } finally {
      setPostingComment(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return
    try {
      const { error } = await supabase
        .from('vehicle_comments')
        .update({ comment: editingCommentText.trim() })
        .eq('id', commentId)
      if (error) throw error
      setEditingCommentId(null)
      setEditingCommentText('')
      await loadVehicleData()
    } catch (error: any) {
      setToast({
        title: 'Update failed',
        message: error.message || 'Could not update comment.',
        dismissing: false,
      })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const { error } = await supabase.from('vehicle_comments').delete().eq('id', commentId)
      if (error) throw error
      await loadVehicleData()
    } catch (error: any) {
      setToast({
        title: 'Delete failed',
        message: error.message || 'Could not delete comment.',
        dismissing: false,
      })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
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
      setToast({ title: 'Changes saved', message: 'Vehicle details were updated.', dismissing: false })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
    } catch (error: any) {
      setToast({
        title: 'Save failed',
        message: error.message || 'Unable to update vehicle right now.',
        dismissing: false,
      })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
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

  const handleResetOilReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!vehicle) return

    const formData = new FormData(e.currentTarget)
    const serviceDate = formData.get('service_date') as string
    const serviceMileage = parseInt(formData.get('service_mileage') as string)
    const nextDueMileage = parseInt(formData.get('next_due_mileage') as string)
    const provider = (formData.get('service_provider') as string) || null
    const notes = (formData.get('notes') as string) || null
    const receipt = formData.get('receipt') as File

    setResettingOil(true)
    try {
      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ oil_change_due_mileage: nextDueMileage })
        .eq('id', vehicleId)
      if (vehicleUpdateError) throw vehicleUpdateError

      const { error: serviceError } = await supabase.from('service_records').insert({
        vehicle_id: vehicleId,
        date: serviceDate,
        mileage: serviceMileage,
        service_type: 'Oil Change',
        description: 'Oil service reminder reset',
        service_provider: provider,
        notes,
      })
      if (serviceError) throw serviceError

      if (receipt && receipt.size > 0) {
        const fileExt = receipt.name.split('.').pop() || 'pdf'
        const fileName = `${vehicleId}/oil-receipts/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('vehicle-documents')
          .upload(fileName, receipt)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('vehicle-documents').getPublicUrl(fileName)

        const { error: docError } = await supabase.from('documents').insert({
          vehicle_id: vehicleId,
          name: `Oil Change Receipt - ${serviceDate}`,
          document_type: 'oil_change_receipt',
          file_url: publicUrl,
          notes: provider ? `Provider: ${provider}` : null,
        })
        if (docError) throw docError
      }

      setShowOilResetModal(false)
      setToast({ title: 'Oil reminder reset', message: 'Service logged and due mileage updated.', dismissing: false })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
      await loadVehicleData()
    } catch (error: any) {
      setToast({
        title: 'Oil reset failed',
        message: error.message || 'Could not reset oil reminder.',
        dismissing: false,
      })
      window.setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
        window.setTimeout(() => setToast(null), 250)
      }, 4200)
    } finally {
      setResettingOil(false)
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
  const registrationDoc = documents.find((doc) =>
    `${doc.document_type} ${doc.name}`.toLowerCase().includes('registration')
  )
  const registrationExpiry = registrationDoc?.expiration_date || null
  const registrationColor = (() => {
    if (!registrationExpiry) return 'text-gray-500 dark:text-gray-400'
    const expiryDate = new Date(registrationExpiry)
    const now = new Date()
    const days = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'text-red-600 dark:text-red-400'
    if (days <= 30) return 'text-orange-500 dark:text-orange-400'
    return 'text-green-600 dark:text-green-400'
  })()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sticky top-14 z-20 py-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Dashboard</span>
          </button>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOilResetModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium"
                  >
                    Reset Oil Reminder
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    Edit Vehicle
                  </button>
                </div>
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {[
                      { label: 'Code', value: vehicle.code || 'N/A' },
                      { label: 'Make', value: vehicle.make || 'N/A' },
                      { label: 'Model', value: vehicle.model || 'N/A' },
                      { label: 'Year', value: vehicle.year ? String(vehicle.year) : 'N/A' },
                      { label: 'License Plate', value: vehicle.license_plate || 'N/A' },
                      { label: 'VIN', value: vehicle.vin || 'N/A' },
                      { label: 'Current Mileage', value: vehicle.current_mileage.toLocaleString() },
                      { label: 'Oil Change Due', value: vehicle.oil_change_due_mileage.toLocaleString() },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/40 dark:bg-gray-900/30">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white break-all">{item.value}</p>
                      </div>
                    ))}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/40 dark:bg-gray-900/30">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Registration Expiry</p>
                      <p className={`mt-1 text-base font-semibold ${registrationColor}`}>
                        {registrationExpiry ? format(new Date(registrationExpiry), 'MMM d, yyyy') : 'N/A'}
                      </p>
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

                {/* Vehicle Comments Thread */}
                <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Vehicle Comments</h3>
                  
                  {/* Comments Thread */}
                  <div className="max-h-80 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No comments yet. Start the conversation!</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="group relative rounded-lg bg-gray-50 dark:bg-gray-900/60 p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                          onMouseEnter={() => setHoveredCommentId(comment.id)}
                          onMouseLeave={() => setHoveredCommentId(null)}
                        >
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null)
                                    setEditingCommentText('')
                                  }}
                                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    {comment.author_email?.split('@')[0] || 'Unknown user'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    {format(new Date(comment.created_at), 'MMM d, yyyy')} at {format(new Date(comment.created_at), 'h:mm a')}
                                  </span>
                                </div>
                                {hoveredCommentId === comment.id && currentUserEmail === comment.author_email && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(comment.id)
                                        setEditingCommentText(comment.comment)
                                      }}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                      aria-label="Edit comment"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                      aria-label="Delete comment"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{comment.comment}</p>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAddComment()
                        }
                      }}
                      rows={3}
                      placeholder="Add a new comment..."
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={postingComment || !newComment.trim()}
                      className="px-6 py-3 h-fit bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      {postingComment ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowServiceModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowIssueModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDocumentModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
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

      {toast && (
        <div className="fixed right-5 bottom-5 z-[70]">
          <button
            type="button"
            onClick={() => {
              setToast((prev) => (prev ? { ...prev, dismissing: true } : prev))
              window.setTimeout(() => setToast(null), 250)
            }}
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

      {showOilResetModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowOilResetModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reset Oil Service Reminder</h2>
            <form onSubmit={handleResetOilReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Oil Change Completed Date *
                </label>
                <input
                  type="date"
                  name="service_date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mileage at Service *
                </label>
                <input
                  type="number"
                  name="service_mileage"
                  defaultValue={vehicle.current_mileage}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Next Oil Change Due Mileage *
                </label>
                <input
                  type="number"
                  name="next_due_mileage"
                  defaultValue={vehicle.current_mileage + 5000}
                  required
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
                  placeholder="Valvoline, Mavis, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Receipt (optional)
                </label>
                <input
                  type="file"
                  name="receipt"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
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
                  disabled={resettingOil}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingOil ? 'Saving...' : 'Reset Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOilResetModal(false)}
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
