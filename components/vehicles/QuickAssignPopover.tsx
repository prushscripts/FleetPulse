'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

type Driver = {
  id: string
  name: string
  nickname?: string | null
  email?: string | null
  location?: string | null
  isNYDriver?: boolean | null
  isDMVDriver?: boolean | null
}

export default function QuickAssignPopover({
  open,
  vehicleLocation,
  drivers,
  onAssign,
  onClose,
}: {
  open: boolean
  vehicleLocation?: string | null
  drivers: Driver[]
  onAssign: (driverId: string) => Promise<void>
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, onClose])

  const filtered = useMemo(() => {
    const locationFiltered = drivers.filter((driver) => {
      if (vehicleLocation === 'New York') return !!driver.isNYDriver || driver.location === 'New York'
      if (vehicleLocation === 'DMV') return !!driver.isDMVDriver || driver.location === 'DMV'
      return true
    })
    if (!q.trim()) return locationFiltered
    const query = q.toLowerCase()
    return locationFiltered.filter((d) =>
      (d.nickname || d.name).toLowerCase().includes(query) ||
      (d.email || '').toLowerCase().includes(query),
    )
  }, [drivers, vehicleLocation, q])

  if (!open) return null

  return (
    <div
      ref={rootRef}
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl card-glass shadow-modal overflow-hidden"
    >
      <div className="p-2 border-b border-white/[0.06]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search drivers..."
            className="input-field h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-500">No eligible drivers found.</div>
        ) : (
          filtered.map((driver) => (
            <button
              key={driver.id}
              type="button"
              onClick={async () => {
                await onAssign(driver.id)
                onClose()
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0"
            >
              <div className="text-sm text-white">{driver.nickname || driver.name}</div>
              <div className="text-xs text-slate-500">{driver.location || 'Unknown'}</div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

