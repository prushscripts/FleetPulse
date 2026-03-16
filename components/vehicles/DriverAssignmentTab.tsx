'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, X, Check, User } from 'lucide-react'

type Driver = {
  id: string
  name: string
  nickname?: string | null
  email?: string | null
  location?: string | null
  isNYDriver?: boolean | null
  isDMVDriver?: boolean | null
}

type Vehicle = {
  id: string
  location?: string | null
  assignedDriverId?: string | null
  assignedDriver?: Driver | null
}

interface Props {
  vehicle: Vehicle
  allDrivers: Driver[]
  onAssign: (driverId: string) => Promise<void>
  onUnassign: () => Promise<void>
}

export default function DriverAssignmentTab({ vehicle, allDrivers, onAssign, onUnassign }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSelector, setShowSelector] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const eligibleDrivers = useMemo(() => {
    const locationFiltered = allDrivers.filter((driver) => {
      if (vehicle.location === 'New York') return !!driver.isNYDriver || driver.location === 'New York'
      if (vehicle.location === 'DMV') return !!driver.isDMVDriver || driver.location === 'DMV'
      return true
    })
    if (!searchQuery) return locationFiltered
    const q = searchQuery.toLowerCase()
    return locationFiltered.filter((d) =>
      (d.nickname || d.name).toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q),
    )
  }, [allDrivers, vehicle.location, searchQuery])

  const handleAssign = async (driverId: string) => {
    setAssigning(true)
    try {
      await onAssign(driverId)
      setShowSelector(false)
      setSearchQuery('')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-lg">
      {vehicle.assignedDriver ? (
        <div className="card-glass rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Assigned Driver</h3>
            <button
              onClick={onUnassign}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Unassign
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-300">
              {(vehicle.assignedDriver.nickname || vehicle.assignedDriver.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold text-white">
                {vehicle.assignedDriver.nickname || vehicle.assignedDriver.name}
              </div>
              <div className="text-sm text-slate-400">{vehicle.assignedDriver.location || 'Unknown'}</div>
              <div className="flex items-center gap-2 mt-1">
                {vehicle.assignedDriver.isNYDriver && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400">NY</span>
                )}
                {vehicle.assignedDriver.isDMVDriver && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400">DMV</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-glass rounded-2xl p-5 mb-4 border-dashed">
          <div className="empty-state py-8">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <User size={18} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 font-medium">No driver assigned</p>
            <p className="text-xs text-slate-600 mt-1">
              Assign a {vehicle.location || 'matching'} driver to this vehicle
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSelector((v) => !v)}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mb-4"
      >
        <UserPlus size={15} />
        {vehicle.assignedDriver ? 'Change Driver' : 'Assign Driver'}
      </button>

      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card-glass rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 bg-blue-500/[0.06] border-b border-blue-500/10 flex items-center gap-2">
              <span className="text-xs text-blue-400">
                Showing {vehicle.location || 'all'} drivers only
              </span>
              {eligibleDrivers.length > 0 && (
                <span className="num-badge bg-blue-500/20 text-blue-400">{eligibleDrivers.length}</span>
              )}
            </div>
            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {eligibleDrivers.length === 0 ? (
                <div className="empty-state py-8 text-slate-600 text-sm">
                  No {vehicle.location || ''} drivers found
                </div>
              ) : (
                eligibleDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleAssign(driver.id)}
                    disabled={assigning}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0 ${
                      driver.id === vehicle.assignedDriverId ? 'bg-blue-500/[0.05]' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                      {(driver.nickname || driver.name).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {driver.nickname || driver.name}
                      </div>
                      <div className="text-xs text-slate-500">{driver.location || 'Unknown'}</div>
                    </div>
                    {driver.id === vehicle.assignedDriverId && (
                      <Check size={14} className="text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

