'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Truck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type Props = {
  vehicleId: string | null
  vehicleCode: string | null
}

export default function DriverReportIssue({ vehicleId, vehicleCode }: Props) {
  const [open, setOpen] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDetails, setIssueDetails] = useState('')
  const [issuePriority, setIssuePriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const noVehicle = !vehicleId

  const canSubmit = useMemo(() => !!issueTitle.trim() && !submitting, [issueTitle, submitting])

  const handleSubmitIssue = async () => {
    if (!issueTitle.trim()) return
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/driver-report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle.trim(),
          description: issueDetails.trim() || null,
          priority: issuePriority,
          vehicle_id: vehicleId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || res.statusText })
        setSubmitting(false)
        return
      }
      setMessage({ type: 'success', text: 'Issue reported. Management will be notified.' })
      setIssueTitle('')
      setIssueDetails('')
      setIssuePriority('medium')
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

  return (
    <>
      <button
        type="button"
        onClick={() => !noVehicle && setOpen(true)}
        disabled={noVehicle}
        className="btn-ghost w-full py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AlertTriangle size={15} />
        {noVehicle ? 'Assign a vehicle to report issues' : 'Report Issue'}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 40,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1629] rounded-t-2xl border-t border-white/[0.08] p-6 pb-10 max-h-[80vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Report an Issue</h3>
                <button
                  onClick={() => !submitting && setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-slate-400"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Vehicle context */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] mb-5">
                <Truck size={13} className="text-blue-400" />
                <span className="text-xs text-slate-400">
                  Vehicle:{' '}
                  <span className="text-white font-medium">{vehicleCode || '—'}</span>
                </span>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g. Brake noise when stopping"
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Details (optional)</label>
                  <textarea
                    value={issueDetails}
                    onChange={(e) => setIssueDetails(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setIssuePriority(p)}
                        className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                          issuePriority === p
                            ? p === 'high'
                              ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                              : p === 'medium'
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                                : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {message && (
                  <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {message.text}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitIssue}
                disabled={!canSubmit}
                className="w-full mt-6 py-4 rounded-xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                type="button"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Submit Issue'
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
