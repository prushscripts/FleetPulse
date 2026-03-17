'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react'

type InspectionType = 'pre_trip' | 'post_trip'

type DriverVehicle = {
  id: string
  code: string | null
  year: number | null
  make: string | null
  model: string | null
  current_mileage: number | null
  company_id: string | null
}

type TemplateChecklistItem = {
  id: string
  category: string
  label: string
  required: boolean
}

const DEFAULT_ITEMS: TemplateChecklistItem[] = [
  { id: '1', category: 'Exterior', label: 'Lights & signals working', required: true },
  { id: '2', category: 'Exterior', label: 'Tires & wheels condition', required: true },
  { id: '3', category: 'Exterior', label: 'Body damage check', required: true },
  { id: '4', category: 'Exterior', label: 'Windows & mirrors clean', required: true },
  { id: '5', category: 'Under Hood', label: 'Engine oil level', required: true },
  { id: '6', category: 'Under Hood', label: 'Coolant level', required: true },
  { id: '7', category: 'Interior', label: 'Brakes feel normal', required: true },
  { id: '8', category: 'Interior', label: 'Steering responsive', required: true },
  { id: '9', category: 'Interior', label: 'Horn working', required: true },
  { id: '10', category: 'Interior', label: 'Seatbelt working', required: true },
  { id: '11', category: 'Interior', label: 'No dashboard warning lights', required: true },
  { id: '12', category: 'Safety', label: 'Fire extinguisher present', required: false },
]

type ItemAnswer = {
  status: 'pass' | 'fail' | null
  note: string
}

class InspectionErrorBoundary extends React.Component<
  { children: React.ReactNode; onBack: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Render fallback UI via state.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
          <div className="text-center px-6 max-w-sm">
            <p className="text-base text-white font-semibold">
              Something went wrong loading the inspection.
            </p>
            <p className="text-sm text-slate-400 mt-2">Please go back and try again.</p>
            <button type="button" className="btn-primary w-full mt-6 py-3" onClick={this.props.onBack}>
              Back
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function DriverInspectionFlowPage() {
  const params = useParams<{ type: string }>()
  const typeParam = params?.type ?? 'pre_trip'
  const router = useRouter()
  const supabase = createClient()

  const inspectionType: InspectionType = typeParam === 'post_trip' ? 'post_trip' : 'pre_trip'

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [driverId, setDriverId] = useState<string | null>(null)
  const [driverDisplayName, setDriverDisplayName] = useState<string>('Driver')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null)
  const [timestamp] = useState<Date>(() => new Date())

  const [items, setItems] = useState<TemplateChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({})

  const [phase, setPhase] = useState<'confirm' | 'odometer' | 'checklist' | 'summary' | 'success'>('confirm')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [odometer, setOdometer] = useState('')
  const [odometerError, setOdometerError] = useState<string | null>(null)
  const [overallNotes, setOverallNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const i of items) {
      if (!seen.has(i.category)) {
        seen.add(i.category)
        list.push(i.category)
      }
    }
    return list
  }, [items])

  const activeCategory = categories[categoryIndex] || ''
  const activeCategoryItems = useMemo(
    () => items.filter((i) => i.category === activeCategory),
    [items, activeCategory],
  )

  const requiredCompleteForActiveCategory = useMemo(() => {
    if (!activeCategoryItems.length) return false
    return activeCategoryItems.every((i) => {
      if (!i.required) return true
      return !!answers[i.id]?.status
    })
  }, [activeCategoryItems, answers])

  const passedCount = useMemo(
    () => items.filter((i) => answers[i.id]?.status === 'pass').length,
    [items, answers],
  )
  const failedItems = useMemo(
    () =>
      items
        .filter((i) => answers[i.id]?.status === 'fail')
        .map((i) => ({ ...i, note: answers[i.id]?.note || '' })),
    [items, answers],
  )

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const cid = (user?.user_metadata?.company_id as string) || null
        setCompanyId(cid)

        const nickname = (user?.user_metadata?.nickname as string | undefined) || ''
        const display = nickname.trim() || (user?.email ? user.email.split('@')[0] : 'Driver')
        setDriverDisplayName(display)

        const { data: driverRow } = await supabase
          .from('drivers')
          .select('id')
          .or(`user_id.eq.${user?.id ?? ''},email.eq.${user?.email ?? ''}`)
          .limit(1)
          .maybeSingle()
        const did = (driverRow as { id?: string } | null)?.id ?? null
        setDriverId(did)

        let vehicleRow: DriverVehicle | null = null
        if (did) {
          const { data: v } = await supabase
            .from('vehicles')
            .select('id, code, year, make, model, current_mileage, company_id')
            .or(`driver_id.eq.${did},assigned_driver_id.eq.${did}`)
            .limit(1)
            .maybeSingle()
          vehicleRow = (v as DriverVehicle | null) ?? null
        }
        setVehicle(vehicleRow)

        let templateItems: TemplateChecklistItem[] = []
        if (cid) {
          const { data: row } = await supabase
            .from('inspection_templates')
            .select('items')
            .eq('company_id', cid)
            .eq('type', inspectionType)
            .order('is_default', { ascending: false })
            .limit(1)
            .maybeSingle()

          const raw = (row as { items?: unknown } | null)?.items
          if (Array.isArray(raw)) {
            templateItems = raw
              .map((r: any, idx: number) => ({
                id: String(r?.id ?? r?.itemId ?? idx + 1),
                category: String(r?.category ?? 'Safety'),
                label: String(r?.label ?? r?.name ?? ''),
                required: typeof r?.required === 'boolean' ? r.required : true,
              }))
              .filter((i) => i.id && i.label)
          }
        }

        if (!templateItems.length) templateItems = DEFAULT_ITEMS

        setItems(templateItems)
        setAnswers(Object.fromEntries(templateItems.map((i) => [i.id, { status: null, note: '' } as ItemAnswer])))
        setCategoryIndex(0)
        setOdometer('')
        setOverallNotes('')
        setSubmitError(null)
        setPhase('confirm')
      } catch {
        setLoadError('Unable to load inspection. Please go back and try again.')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionType])

  useEffect(() => {
    if (!odometer.trim()) {
      setOdometerError(null)
      return
    }
    const n = Number(odometer)
    if (!Number.isFinite(n) || n <= 0) {
      setOdometerError('Enter a valid mileage.')
      return
    }
    const last = vehicle?.current_mileage ?? 0
    if (last && n < last) {
      setOdometerError(`Mileage cannot be lower than last recorded (${last.toLocaleString()} mi)`)
      return
    }
    setOdometerError(null)
  }, [odometer, vehicle?.current_mileage])

  const beginDisabled = !vehicle?.id
  const canContinueOdometer = !!odometer.trim() && !odometerError

  const submit = async () => {
    if (!vehicle?.id || !companyId || !driverId) {
      setSubmitError('Missing vehicle assignment. Contact your fleet manager.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const odometerValue = Number(odometer)
      const status: 'passed' | 'failed' = failedItems.length > 0 ? 'failed' : 'passed'

      const results = items.map((i) => ({
        itemId: i.id,
        label: i.label,
        category: i.category,
        required: i.required,
        passed: answers[i.id]?.status === 'pass',
        note: answers[i.id]?.note || '',
      }))

      const { error: insErr } = await supabase.from('inspections').insert({
        company_id: companyId,
        vehicle_id: vehicle.id,
        driver_id: driverId,
        submitted_by_user_id: user.id,
        type: inspectionType,
        status,
        odometer: odometerValue,
        notes: overallNotes || null,
        results,
      })
      if (insErr) throw insErr

      for (const f of failedItems) {
        await supabase.from('issues').insert({
          vehicle_id: vehicle.id,
          title: `${f.label} — failed during inspection`,
          description: f.note || null,
          status: 'open',
          priority: 'high',
          reported_date: new Date().toISOString().slice(0, 10),
        })
      }

      setPhase('success')
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to submit inspection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <p className="text-base text-white font-semibold">Unable to start inspection</p>
          <p className="text-sm text-slate-400 mt-2">{loadError}</p>
          <button type="button" className="btn-primary w-full mt-6 py-3" onClick={() => router.back()}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <InspectionErrorBoundary onBack={() => router.back()}>
      <div className="min-h-screen bg-[#0A0F1E] pt-6 pb-24 px-4 text-white">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {phase === 'confirm' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-400 mb-3">
              Starting {inspectionType === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'} Inspection
            </p>
            <p className="text-slate-500 text-sm mb-2">
              {timestamp.toLocaleDateString()} · {driverDisplayName}
            </p>
            <div className="font-mono text-5xl font-bold text-white tracking-tight">
              {vehicle?.code || '—'}
            </div>
            <p className="text-slate-400 mt-2">
              {vehicle ? `${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''}` : 'No assigned vehicle.'}
            </p>

            <button
              type="button"
              disabled={beginDisabled}
              onClick={() => setPhase('odometer')}
              className="w-full max-w-sm mt-8 min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Begin Inspection <ArrowRight size={18} />
            </button>
            {beginDisabled && (
              <p className="text-sm text-amber-400 mt-4">No vehicle assigned. Contact your fleet manager.</p>
            )}
          </div>
        )}

        {phase === 'odometer' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">Enter current odometer reading</h2>
            <p className="text-sm text-slate-400 mb-5">Use the current mileage on your dashboard.</p>

            <input
              value={odometer}
              onChange={(e) => setOdometer(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder={vehicle?.current_mileage ? `${vehicle.current_mileage.toLocaleString()}` : '0'}
              className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-2xl font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all"
            />
            {odometerError && <p className="text-sm text-red-400 mt-2">{odometerError}</p>}

            <button
              type="button"
              disabled={!canContinueOdometer}
              onClick={() => setPhase('checklist')}
              className="w-full mt-6 min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {phase === 'checklist' && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Category</p>
                <h2 className="text-2xl font-bold text-white mt-1">{activeCategory.toUpperCase()}</h2>
              </div>
              <p className="text-xs text-slate-400">
                Category {Math.min(categoryIndex + 1, categories.length)} of {categories.length}
              </p>
            </div>

            <div className="space-y-4">
              {activeCategoryItems.map((it) => {
                const a = answers[it.id] || { status: null, note: '' }
                return (
                  <div key={it.id} className="card-glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base text-white leading-snug">{it.label}</p>
                      {it.required && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Required</span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [it.id]: { ...a, status: 'pass' } }))
                        }
                        className={`min-h-[56px] rounded-xl font-semibold text-sm transition-all ${
                          a.status === 'pass'
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                        }`}
                      >
                        ✓ Pass
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [it.id]: { ...a, status: 'fail' } }))
                        }
                        className={`min-h-[56px] rounded-xl font-semibold text-sm transition-all ${
                          a.status === 'fail'
                            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                        }`}
                      >
                        ✗ Fail
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {a.status === 'fail' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <textarea
                            value={a.note}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [it.id]: { ...a, note: e.target.value } }))
                            }
                            placeholder="Add notes (recommended)..."
                            rows={3}
                            className="mt-3 w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!requiredCompleteForActiveCategory}
              onClick={() => {
                const next = categoryIndex + 1
                if (next >= categories.length) setPhase('summary')
                else setCategoryIndex(next)
              }}
              className="w-full mt-6 min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {categoryIndex + 1 >= categories.length ? 'Review & Submit' : 'Next Category'}{' '}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {phase === 'summary' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Summary</h2>
            <p className="text-sm text-slate-400 mb-5">
              {passedCount} passed, {failedItems.length} failed
            </p>

            {failedItems.length > 0 && (
              <div className="card-glass rounded-2xl p-4 border border-red-500/20 bg-red-500/[0.06] mb-4">
                <p className="text-sm font-semibold text-red-200 mb-3">Failed items</p>
                <div className="space-y-3">
                  {failedItems.map((f) => (
                    <div key={f.id} className="text-sm">
                      <p className="text-white">{f.label}</p>
                      {f.note?.trim() ? (
                        <p className="text-xs text-slate-300 mt-1">{f.note}</p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1 italic">No notes</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-glass rounded-2xl p-4">
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Overall notes</label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Anything else your fleet manager should know..."
                rows={4}
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
              />
            </div>

            {submitError && <p className="text-sm text-red-300 mt-4">{submitError}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full mt-6 min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Inspection'
              )}
            </button>
          </div>
        )}

        {phase === 'success' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6">
              <CheckCircle2 size={34} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-display font-bold text-white">Inspection Complete</div>
            <div className="mt-2 text-sm text-slate-400">
              {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
            </div>

            <button
              type="button"
              className="w-full max-w-sm mt-8 min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold"
              onClick={() => router.push('/driver')}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </InspectionErrorBoundary>
  )
}

