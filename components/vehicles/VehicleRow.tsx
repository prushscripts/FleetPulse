'use client'

import { ArrowRight, UserPlus } from 'lucide-react'

export interface VehicleRowItem {
  id: string
  code: string
  type?: string | null
  location?: string | null
  mileage?: number | null
  oilDueMileage?: number | null
  driverName?: string | null
}

export default function VehicleRow({
  vehicle,
  onOpen,
  onQuickAssign,
}: {
  vehicle: VehicleRowItem
  onOpen: () => void
  onQuickAssign: () => void
}) {
  const current = vehicle.mileage ?? 0
  const due = vehicle.oilDueMileage ?? 0
  const overdue = current > due
  const overdueMiles = current - due

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left group flex items-center gap-3 px-4 py-3 border-l-2 ${
        overdue ? 'border-l-red-500/60' : 'border-l-emerald-500/40'
      } hover:bg-white/[0.03] transition-colors`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-white">{vehicle.code}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-slate-400 uppercase tracking-wide">
            {vehicle.type || 'Vehicle'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{vehicle.location || 'Unknown location'}</p>
      </div>

      <div className="hidden sm:block text-right">
        <div className="text-sm text-white font-mono">{current.toLocaleString()} mi</div>
        <div className="text-[11px] text-slate-500">
          {overdue ? `Oil +${overdueMiles.toLocaleString()} mi overdue` : 'Oil OK'}
        </div>
      </div>

      {vehicle.driverName ? (
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="w-4 h-4 rounded-full bg-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-300">
            {vehicle.driverName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-300 max-w-[80px] truncate">{vehicle.driverName}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAssign()
          }}
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-white/10 text-slate-600 hover:border-blue-500/30 hover:text-blue-400 transition-all text-xs"
        >
          <UserPlus size={11} />
          <span>Assign</span>
        </button>
      )}

      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        Open <ArrowRight size={11} />
      </span>
    </button>
  )
}

