'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Edit2,
  ChevronRight,
  Truck,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import type { VehicleWithStats } from '@/lib/dashboard-types'
import DriverAssignmentTab from '@/components/vehicles/DriverAssignmentTab'

type Driver = {
  id: string
  name: string
  nickname?: string | null
  email?: string | null
  location?: string | null
  isNYDriver?: boolean | null
  isDMVDriver?: boolean | null
}

interface Props {
  vehicle: VehicleWithStats | null
  open: boolean
  onClose: () => void
  allDrivers?: Driver[]
  onAssignDriver?: (vehicleId: string, driverId: string) => Promise<void>
  onUnassignDriver?: (vehicleId: string) => Promise<void>
}

export default function VehiclePanel({
  vehicle,
  open,
  onClose,
  allDrivers = [],
  onAssignDriver,
  onUnassignDriver,
}: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'service', label: 'Service' },
    { id: 'issues', label: 'Issues' },
    { id: 'driver', label: 'Driver' },
    { id: 'docs', label: 'Docs' },
  ]

  if (!vehicle) return null

  const mileage = vehicle.current_mileage ?? 0
  const oilDue = vehicle.oil_change_due_mileage ?? 0
  const oilOverdueMiles = oilDue > 0 && mileage >= oilDue ? mileage - oilDue : 0
  const location = vehicle.group_name ?? 'Other'
  const assignedDriver = vehicle.driver_name
    ? { id: vehicle.driver_id ?? '', name: vehicle.driver_name, nickname: vehicle.driver_name }
    : null

  const panelVehicleForDriverTab = {
    id: vehicle.id,
    location,
    assignedDriverId: vehicle.driver_id,
    assignedDriver,
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { type: 'spring', stiffness: 400, damping: 40, mass: 0.8 },
            }}
            exit={{
              x: '100%',
              opacity: 0,
              transition: { duration: 0.2, ease: 'easeIn' },
            }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-full max-w-lg bg-[#0A0F1E] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    vehicle.vehicle_type?.toLowerCase() === 'van' ? 'bg-blue-500/10' : 'bg-violet-500/10'
                  }`}
                >
                  <Truck size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono font-bold text-lg text-white">{vehicle.code}</h2>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-slate-400 uppercase">
                      {vehicle.vehicle_type ?? '—'}
                    </span>
                    {oilOverdueMiles > 0 ? (
                      <span className="badge badge-danger text-[10px]">Oil Overdue</span>
                    ) : (
                      <span className="badge badge-active text-[10px]">Oil OK</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vehicle.year ?? ''} {vehicle.make ?? ''} · {location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
                  onClick={() => {
                    onClose()
                    window.location.href = `/dashboard/vehicles/${vehicle.id}`
                  }}
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
                  aria-label="Close panel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 border-b border-white/[0.06] flex-shrink-0">
              {[
                {
                  label: 'Mileage',
                  value: mileage.toLocaleString() + ' mi',
                  color: 'text-white',
                },
                {
                  label: 'Oil Due',
                  value: oilDue > 0 ? oilDue.toLocaleString() + ' mi' : '—',
                  color: oilOverdueMiles > 0 ? 'text-red-400' : 'text-white',
                },
                {
                  label: 'Open Issues',
                  value: String(vehicle.open_issues_count ?? 0),
                  color:
                    (vehicle.open_issues_count ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="px-4 py-3 border-r border-white/[0.06] last:border-0 text-center"
                >
                  <div className={`font-mono font-semibold text-sm ${color}`}>{value}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] flex-shrink-0 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-white border-blue-500'
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content — scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="card-glass rounded-xl p-4">
                    <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Vehicle Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Year', value: vehicle.year ?? '—' },
                        { label: 'Make', value: vehicle.make ?? '—' },
                        { label: 'Model', value: vehicle.model ?? '—' },
                        { label: 'Type', value: vehicle.vehicle_type ?? '—' },
                        { label: 'Location', value: location },
                        { label: 'Status', value: vehicle.status ?? '—' },
                        { label: 'VIN', value: vehicle.vin ?? '—' },
                        { label: 'Plate', value: vehicle.license_plate ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="text-[10px] text-slate-600 mb-0.5">{label}</div>
                          <div className="text-xs text-white font-medium">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Log Service', icon: Wrench, color: 'text-blue-400' },
                      { label: 'Report Issue', icon: AlertTriangle, color: 'text-amber-400' },
                      { label: 'Add Document', icon: FileText, color: 'text-violet-400' },
                      {
                        label: 'Start Inspection',
                        icon: ClipboardCheck,
                        color: 'text-emerald-400',
                      },
                    ].map(({ label, icon: Icon, color }) => (
                      <button
                        key={label}
                        type="button"
                        className="card-glass rounded-xl p-3 flex items-center gap-2 hover:border-white/20 transition-all text-left group"
                        onClick={() => {
                          onClose()
                          window.location.href = `/dashboard/vehicles/${vehicle.id}`
                        }}
                      >
                        <Icon size={14} className={color} />
                        <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'driver' && (
                <div>
                  {onAssignDriver && onUnassignDriver ? (
                    <DriverAssignmentTab
                      vehicle={panelVehicleForDriverTab}
                      allDrivers={allDrivers}
                      onAssign={async (driverId) => {
                        await onAssignDriver(vehicle.id, driverId)
                      }}
                      onUnassign={async () => {
                        await onUnassignDriver(vehicle.id)
                      }}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Open full page to assign or change driver.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'service' && (
                <p className="text-sm text-slate-500">
                  Open full vehicle page to view and log service.
                </p>
              )}
              {activeTab === 'issues' && (
                <p className="text-sm text-slate-500">
                  Open full vehicle page to view and manage issues.
                </p>
              )}
              {activeTab === 'docs' && (
                <p className="text-sm text-slate-500">
                  Open full vehicle page to view documents.
                </p>
              )}
            </div>

            {/* Panel footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.location.href = `/dashboard/vehicles/${vehicle.id}`
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Open full page
                <ChevronRight size={12} />
              </button>
              <span className="text-[10px] text-slate-700 font-mono">{vehicle.id?.slice(0, 8)}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
