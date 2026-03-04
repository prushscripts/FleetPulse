'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AdminClientProps {
  user: User
}

interface VoyagerCardMapping {
  id: string
  card_number: string
  vehicle_id: string
  vehicle_code: string
  active: boolean
  notes: string | null
}

interface VoyagerApiConfig {
  id: string
  api_key: string
  api_endpoint: string | null
  account_id: string | null
  enabled: boolean
  last_sync_at: string | null
}

export default function AdminClient({ user }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'cards' | 'api'>('cards')
  const [cardMappings, setCardMappings] = useState<VoyagerCardMapping[]>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; code: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Card mapping form
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<VoyagerCardMapping | null>(null)
  const [cardForm, setCardForm] = useState({
    card_number: '',
    vehicle_id: '',
    active: true,
    notes: '',
  })

  // API config form
  const [apiConfig, setApiConfig] = useState<VoyagerApiConfig | null>(null)
  const [apiForm, setApiForm] = useState({
    api_key: '',
    api_endpoint: '',
    account_id: '',
    enabled: false,
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, code')
        .order('code', { ascending: true })

      if (vehiclesError) throw vehiclesError
      setVehicles(vehiclesData || [])

      // Load card mappings
      const { data: cardsData, error: cardsError } = await supabase
        .from('voyager_card_mappings')
        .select('*')
        .order('card_number', { ascending: true })

      if (cardsError) throw cardsError
      setCardMappings(cardsData || [])

      // Load API config
      const { data: configData, error: configError } = await supabase
        .from('voyager_api_config')
        .select('*')
        .limit(1)
        .single()

      if (configError && configError.code !== 'PGRST116') throw configError // PGRST116 = no rows
      if (configData) {
        setApiConfig(configData)
        setApiForm({
          api_key: configData.api_key || '',
          api_endpoint: configData.api_endpoint || '',
          account_id: configData.account_id || '',
          enabled: configData.enabled || false,
        })
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCardMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const vehicle = vehicles.find((v) => v.id === cardForm.vehicle_id)
      if (!vehicle) throw new Error('Vehicle not found')

      const cardData = {
        card_number: cardForm.card_number.trim(),
        vehicle_id: cardForm.vehicle_id,
        vehicle_code: vehicle.code,
        active: cardForm.active,
        notes: cardForm.notes.trim() || null,
        created_by: user.id,
      }

      if (editingCard) {
        const { error } = await supabase
          .from('voyager_card_mappings')
          .update(cardData)
          .eq('id', editingCard.id)
        if (error) throw error
        setMessage({ type: 'success', text: 'Card mapping updated successfully!' })
      } else {
        const { error } = await supabase
          .from('voyager_card_mappings')
          .insert([cardData])
        if (error) throw error
        setMessage({ type: 'success', text: 'Card mapping created successfully!' })
      }

      setShowCardModal(false)
      setEditingCard(null)
      setCardForm({ card_number: '', vehicle_id: '', active: true, notes: '' })
      loadData()
    } catch (error: any) {
      console.error('Error saving card mapping:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save card mapping' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCardMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card mapping?')) return

    try {
      const { error } = await supabase
        .from('voyager_card_mappings')
        .delete()
        .eq('id', id)
      if (error) throw error
      setMessage({ type: 'success', text: 'Card mapping deleted successfully!' })
      loadData()
    } catch (error: any) {
      console.error('Error deleting card mapping:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete card mapping' })
    }
  }

  const handleSaveApiConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const configData = {
        api_key: apiForm.api_key.trim(),
        api_endpoint: apiForm.api_endpoint.trim() || null,
        account_id: apiForm.account_id.trim() || null,
        enabled: apiForm.enabled,
        updated_by: user.id,
      }

      if (apiConfig) {
        const { error } = await supabase
          .from('voyager_api_config')
          .update(configData)
          .eq('id', apiConfig.id)
        if (error) throw error
        setMessage({ type: 'success', text: 'API configuration updated successfully!' })
      } else {
        const { error } = await supabase
          .from('voyager_api_config')
          .insert([configData])
        if (error) throw error
        setMessage({ type: 'success', text: 'API configuration saved successfully!' })
      }

      loadData()
    } catch (error: any) {
      console.error('Error saving API config:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save API configuration' })
    } finally {
      setSaving(false)
    }
  }

  const openCardModal = (card?: VoyagerCardMapping) => {
    if (card) {
      setEditingCard(card)
      setCardForm({
        card_number: card.card_number,
        vehicle_id: card.vehicle_id,
        active: card.active,
        notes: card.notes || '',
      })
    } else {
      setEditingCard(null)
      setCardForm({ card_number: '', vehicle_id: '', active: true, notes: '' })
    }
    setShowCardModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage Voyager US Bank fleet gas card integration
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'cards'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Card Mappings
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'api'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              API Configuration
            </button>
          </div>
        </div>

        {/* Card Mappings Tab */}
        {activeTab === 'cards' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gas Card to Vehicle Mappings</h2>
              <button
                onClick={() => openCardModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
              >
                Add Card Mapping
              </button>
            </div>

            {cardMappings.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No card mappings yet. Add your first mapping to get started.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr className="text-left text-xs tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3">Card Number</th>
                      <th className="px-4 py-3">Vehicle Code</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cardMappings.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{card.card_number}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{card.vehicle_code}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {card.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{card.notes || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCardModal(card)}
                              className="px-3 py-1 rounded-md text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCardMapping(card.id)}
                              className="px-3 py-1 rounded-md text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
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

        {/* API Configuration Tab */}
        {activeTab === 'api' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Voyager API Configuration</h2>
            <form onSubmit={handleSaveApiConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={apiForm.api_key}
                  onChange={(e) => setApiForm({ ...apiForm, api_key: e.target.value })}
                  placeholder="Enter your Voyager API key"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your Voyager API key (stored securely)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Endpoint
                </label>
                <input
                  type="url"
                  value={apiForm.api_endpoint}
                  onChange={(e) => setApiForm({ ...apiForm, api_endpoint: e.target.value })}
                  placeholder="https://api.voyager.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account ID
                </label>
                <input
                  type="text"
                  value={apiForm.account_id}
                  onChange={(e) => setApiForm({ ...apiForm, account_id: e.target.value })}
                  placeholder="Your Voyager account ID"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={apiForm.enabled}
                  onChange={(e) => setApiForm({ ...apiForm, enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable automatic mileage sync
                </label>
              </div>
              {apiConfig?.last_sync_at && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last sync: {new Date(apiConfig.last_sync_at).toLocaleString()}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save API Configuration'}
              </button>
            </form>
          </div>
        )}

        {/* Card Mapping Modal */}
        {showCardModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => {
              setShowCardModal(false)
              setEditingCard(null)
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-[calc(100vw-2rem)] sm:max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingCard ? 'Edit Card Mapping' : 'Add Card Mapping'}
              </h3>
              <form onSubmit={handleSaveCardMapping} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    value={cardForm.card_number}
                    onChange={(e) => setCardForm({ ...cardForm, card_number: e.target.value })}
                    placeholder="e.g., z611"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle *
                  </label>
                  <select
                    value={cardForm.vehicle_id}
                    onChange={(e) => setCardForm({ ...cardForm, vehicle_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={cardForm.notes}
                    onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={cardForm.active}
                    onChange={(e) => setCardForm({ ...cardForm, active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingCard ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCardModal(false)
                      setEditingCard(null)
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
      </div>
    </div>
  )
}
