'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  vehicleId: string | null
  vehicleCode: string | null
}

export default function DriverReportIssue({ vehicleId, vehicleCode }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/driver-report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, priority }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || res.statusText })
        setSubmitting(false)
        return
      }
      setMessage({ type: 'success', text: 'Issue reported. Management will be notified.' })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setTimeout(() => {
        setOpen(false)
        setMessage(null)
      }, 1500)
    } catch (_) {
      setMessage({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setSubmitting(false)
    }
  }

  const noVehicle = !vehicleId

  return (
    <>
      <button
        type="button"
        onClick={() => !noVehicle && setOpen(true)}
        disabled={noVehicle}
        className="btn-ghost w-full mt-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AlertTriangle size={15} />
        {noVehicle ? 'Assign a vehicle to report issues' : 'Any issues? Report now'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="card-glass rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Report an issue</h3>
              <button
                type="button"
                onClick={() => !submitting && setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {vehicleCode && (
              <p className="text-xs text-slate-500 mb-3">Vehicle: {vehicleCode}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Brake noise when stopping"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Details (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  className="input-field w-full min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                  className="input-field w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting || !title.trim()} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60">
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={() => !submitting && setOpen(false)} className="btn-ghost py-2.5 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
