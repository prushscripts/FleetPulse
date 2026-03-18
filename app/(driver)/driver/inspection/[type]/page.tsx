'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ChevronLeft, Truck, AlertTriangle } from 'lucide-react'

type InspectionType = 'pre_trip' | 'post_trip'

type DriverVehicle = {
  id: string
  code: string | null
  year: number | null
  make: string | null
  model: string | null
  current_mileage: number | null
  company_id: string | null
  location?: string | null
  oil_change_due_mileage?: number | null
}

type TemplateChecklistItem = {
  id: string
  category: string
  label: string
  required: boolean
}

// Pre-trip only: Exterior 6 + Interior 6. No under hood, no fire extinguisher.
const INSPECTION_ITEMS: TemplateChecklistItem[] = [
  { id: 'ext-1', category: 'Exterior', label: 'Headlights & taillights working', required: true },
  { id: 'ext-2', category: 'Exterior', label: 'Turn signals & hazards working', required: true },
  { id: 'ext-3', category: 'Exterior', label: 'Tires — no visible damage or low pressure', required: true },
  { id: 'ext-4', category: 'Exterior', label: 'No new body damage', required: true },
  { id: 'ext-5', category: 'Exterior', label: 'Mirrors clean and properly adjusted', required: true },
  { id: 'ext-6', category: 'Exterior', label: 'Windshield — no cracks or obstructions', required: true },
  { id: 'int-1', category: 'Interior', label: 'Brakes feel normal', required: true },
  { id: 'int-2', category: 'Interior', label: 'Steering feels normal', required: true },
  { id: 'int-3', category: 'Interior', label: 'Horn works', required: true },
  { id: 'int-4', category: 'Interior', label: 'Seatbelt works', required: true },
  { id: 'int-5', category: 'Interior', label: 'No warning lights on dashboard', required: true },
  { id: 'int-6', category: 'Interior', label: 'Wipers working', required: true },
]

type ItemAnswer = {
  status: 'pass' | 'fail' | null
  note: string
}

type Phase = 'vehicle' | 'confirm' | 'odometer' | 'checklist' | 'summary' | 'success'

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
  const router = useRouter()
  const supabase = createClient()

  // Wheelzup workflow: only pre-trip inspections.
  // If a user hits /post_trip, we still run the pre-trip flow so the UI never blanks.
  const inspectionType: InspectionType = 'pre_trip'

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [driverId, setDriverId] = useState<string | null>(null)
  const [driverDisplayName, setDriverDisplayName] = useState<string>('Driver')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null)
  const [openIssuesCount, setOpenIssuesCount] = useState(0)
  const [timestamp] = useState<Date>(() => new Date())

  const [items, setItems] = useState<TemplateChecklistItem[]>([])
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({})

  const [phase, setPhase] = useState<Phase>('vehicle')
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
      const a = answers[i.id]
      // If not required, unanswered items are allowed.
      if (!a?.status) return !i.required
      // If failed, you must include a "why".
      if (a.status === 'fail') return a.note.trim().length > 0
      return true
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

  // Normalize API vehicle shape to DriverVehicle (vehicles table uses code, current_mileage).
  const toDriverVehicle = (v: Record<string, unknown> | null): DriverVehicle | null => {
    if (!v || typeof v.id !== 'string') return null
    return {
      id: v.id as string,
      code: (v.code ?? v.truck_number ?? null) as string | null,
      year: typeof v.year === 'number' ? v.year : null,
      make: (v.make ?? null) as string | null,
      model: (v.model ?? null) as string | null,
      current_mileage: typeof v.current_mileage === 'number' ? v.current_mileage : (v.mileage as number) ?? null,
      company_id: (v.company_id ?? null) as string | null,
      location: (v.location ?? null) as string | null,
      oil_change_due_mileage: typeof v.oil_change_due_mileage === 'number' ? v.oil_change_due_mileage : null,
    }
  }

  useEffect(() => {
    const loadDriverAndVehicle = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const cid = (user.user_metadata?.company_id as string) || null
      setCompanyId(cid)
      const nickname = (user.user_metadata?.nickname as string | undefined) || ''
      const display = nickname.trim() || (user.email ? user.email.split('@')[0] : 'Driver')
      setDriverDisplayName(display)

      type DriverRow = { id: string; [k: string]: unknown }
      type VehicleRow = Record<string, unknown>
      let driver: DriverRow | null = null
      let vehicleRow: DriverVehicle | null = null

      const vehicleSelect = 'id, code, year, make, model, current_mileage, company_id, location, oil_change_due_mileage'

      // METHOD 1: Find driver by user_id, then vehicle by driver_id or assigned_driver_id
      let { data: d1 } = await supabase.from('drivers').select('id').eq('user_id', user.id).maybeSingle()
      driver = d1 as DriverRow | null
      if (driver) {
        const { data: v } = await supabase
          .from('vehicles')
          .select(vehicleSelect)
          .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
          .limit(1)
          .maybeSingle()
        vehicleRow = toDriverVehicle(v as VehicleRow | null)
      }
      console.log('Inspection lookup METHOD 1 (user_id): driver found:', !!driver, 'vehicle found:', !!vehicleRow)

      // METHOD 2: Find driver by email
      if (!driver?.id || !vehicleRow) {
        const { data: d2 } = await supabase
          .from('drivers')
          .select('id')
          .eq('email', user.email ?? '')
          .limit(1)
          .maybeSingle()
        if (d2) driver = d2 as DriverRow
        if (driver && !vehicleRow) {
          const { data: v } = await supabase
            .from('vehicles')
            .select(vehicleSelect)
            .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
            .limit(1)
            .maybeSingle()
          vehicleRow = toDriverVehicle(v as VehicleRow | null)
        }
      }
      console.log('Inspection lookup METHOD 2 (email): driver found:', !!driver, 'vehicle found:', !!vehicleRow)

      // METHOD 3: Vehicle directly by assigned_driver_id / driver_id (driver already found)
      if (driver && !vehicleRow) {
        const { data: v } = await supabase
          .from('vehicles')
          .select(vehicleSelect)
          .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
          .limit(1)
          .maybeSingle()
        vehicleRow = toDriverVehicle(v as VehicleRow | null)
      }
      console.log('Inspection lookup METHOD 3 (vehicle by driver id): vehicle found:', !!vehicleRow)

      // METHOD 4: Profile company_id then driver by company_id + email
      if (!driver && cid) {
        const { data: d4 } = await supabase
          .from('drivers')
          .select('id')
          .eq('company_id', cid)
          .eq('email', user.email ?? '')
          .maybeSingle()
        if (d4) driver = d4 as DriverRow
        if (driver && !vehicleRow) {
          const { data: v } = await supabase
            .from('vehicles')
            .select(vehicleSelect)
            .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
            .limit(1)
            .maybeSingle()
          vehicleRow = toDriverVehicle(v as VehicleRow | null)
        }
      }
      if (!driver && !cid) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()
        const profileCompanyId = (profile as { company_id?: string } | null)?.company_id
        if (profileCompanyId) {
          const { data: d4 } = await supabase
            .from('drivers')
            .select('id')
            .eq('company_id', profileCompanyId)
            .eq('email', user.email ?? '')
            .maybeSingle()
          if (d4) driver = d4 as DriverRow
          if (driver && !vehicleRow) {
            const { data: v } = await supabase
              .from('vehicles')
              .select(vehicleSelect)
              .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
              .limit(1)
              .maybeSingle()
            vehicleRow = toDriverVehicle(v as VehicleRow | null)
          }
        }
      }
      console.log('Inspection lookup METHOD 4 (profile/company+email): driver found:', !!driver, 'vehicle found:', !!vehicleRow)

      setDriverId(driver?.id ?? null)
      setVehicle(vehicleRow)

      if (vehicleRow?.id) {
        const { count } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('vehicle_id', vehicleRow.id)
          .neq('status', 'resolved')
        setOpenIssuesCount(count ?? 0)
      } else {
        setOpenIssuesCount(0)
      }
      if (!cid && vehicleRow?.company_id) setCompanyId(vehicleRow.company_id)

      setItems(INSPECTION_ITEMS)
      setAnswers(Object.fromEntries(INSPECTION_ITEMS.map((i) => [i.id, { status: null, note: '' } as ItemAnswer])))
      setCategoryIndex(0)
      setOdometer('')
      setOverallNotes('')
      setSubmitError(null)
      setPhase('vehicle')
    }

    const run = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        await loadDriverAndVehicle()
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

  // Prevent iOS zoom on input focus
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1')
    }
    return () => {
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }
  }, [])

  // Reset scroll between steps and after keyboard closes
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        window.scrollTo(0, 0)
      }
    })
  }, [phase, categoryIndex])

  const beginDisabled = !vehicle?.id
  const canContinueOdometer = !!odometer.trim() && !odometerError

  const submit = async () => {
    const effectiveCompanyId = companyId ?? vehicle?.company_id ?? null
    if (!vehicle?.id || !effectiveCompanyId || !driverId) {
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

      const { data: newInspection, error: insErr } = await supabase
        .from('inspections')
        .insert({
          company_id: effectiveCompanyId,
          vehicle_id: vehicle.id,
          driver_id: driverId,
          submitted_by_user_id: user.id,
          type: inspectionType,
          status,
          odometer: odometerValue,
          notes: overallNotes || null,
          results,
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      const inspectionId = (newInspection as { id?: string } | null)?.id ?? null

      for (const f of failedItems) {
        await supabase.from('issues').insert({
          vehicle_id: vehicle.id,
          title: `${f.label} — failed during inspection`,
          description: f.note || null,
          status: 'open',
          priority: 'high',
          reported_date: new Date().toISOString().slice(0, 10),
          source: 'pre_trip',
          inspection_id: inspectionId,
        })
      }

      if (status === 'failed' && effectiveCompanyId && failedItems.length > 0) {
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_id: effectiveCompanyId,
              type: 'inspection_failed',
              title: `Failed inspection — ${vehicle.code ?? vehicle.id}`,
              body: `${driverDisplayName} submitted a pre-trip inspection with ${failedItems.length} failed item${failedItems.length > 1 ? 's' : ''}.`,
              data: {
                vehicle_id: vehicle.id,
                vehicle_number: vehicle.code,
                inspection_id: inspectionId,
                driver_name: driverDisplayName,
                failed_count: failedItems.length,
              },
              territory: vehicle.location ?? undefined,
            }),
          })
        } catch (_) {
          // Non-blocking
        }
      }

      setPhase('success')
    } catch (e: any) {
      const msg = e?.message ?? ''
      if (msg.includes('company_id') && msg.toLowerCase().includes('schema')) {
        setSubmitError(
          'Database needs an update. Ask your fleet admin to run the "add-inspections-company-id" script in Supabase, then try again.'
        )
      } else {
        setSubmitError(msg || 'Failed to submit inspection. Please try again.')
      }
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
      <div
        className="min-h-screen bg-[#0A0F1E] pt-6 pb-24 px-4 text-white overflow-x-hidden touch-manipulation"
        style={{ overflowAnchor: 'auto' }}
        onPointerDown={(e) => {
          const el = e.target as HTMLElement | null
          if (!el) return
          const tag = el.tagName
          const interactive = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'LABEL'].includes(tag)
          if (!interactive) {
            const active = document.activeElement as HTMLElement | null
            active?.blur?.()
          }
        }}
      >
        {phase !== 'vehicle' && phase !== 'success' && (
          <button
            type="button"
            onClick={() => {
              if (phase === 'odometer') setPhase('vehicle')
              else if (phase === 'checklist') {
                if (categoryIndex > 0) setCategoryIndex((i) => i - 1)
                else setPhase('odometer')
              } else if (phase === 'summary') {
                setCategoryIndex(categories.length - 1)
                setPhase('checklist')
              } else router.back()
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {phase === 'vehicle' && (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6 pb-8 pt-16"
            >
              <div className="text-center mb-8">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono">
                  PRE-TRIP INSPECTION
                </div>
                <h1 className="text-2xl font-display font-bold text-white">Vehicle Check</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Truck size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xl font-mono font-bold text-white">{vehicle?.code ?? '—'}</div>
                    <div className="text-sm text-slate-400">
                      {vehicle ? `${vehicle.year ?? ''} ${vehicle.make ?? ''} ${vehicle.model ?? ''}` : 'No vehicle'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Mileage</div>
                    <div className="font-mono text-sm text-white">
                      {(vehicle?.current_mileage ?? 0).toLocaleString()} mi
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Oil Status</div>
                    <div
                      className={`text-sm font-medium ${
                        (vehicle?.current_mileage ?? 0) >= (vehicle?.oil_change_due_mileage ?? 0) && (vehicle?.oil_change_due_mileage ?? 0) > 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(vehicle?.current_mileage ?? 0) >= (vehicle?.oil_change_due_mileage ?? 0) && (vehicle?.oil_change_due_mileage ?? 0) > 0
                        ? '⚠ Overdue'
                        : '✓ OK'}
                    </div>
                  </div>
                </div>
                {openIssuesCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-amber-400">
                    <AlertTriangle size={14} />
                    <span className="text-xs">
                      {openIssuesCount} open issue{openIssuesCount > 1 ? 's' : ''} on this vehicle
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-8 text-slate-500 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300">
                  {driverDisplayName.charAt(0).toUpperCase()}
                </div>
                <span>
                  Inspector: <span className="text-white">{driverDisplayName}</span>
                </span>
              </div>

              <button
                type="button"
                disabled={beginDisabled}
                onClick={() => setPhase('odometer')}
                className="w-full max-w-sm py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Begin Inspection <ArrowRight size={18} />
              </button>
              {beginDisabled && (
                <p className="text-sm text-amber-400 mt-4">No vehicle assigned. Contact your fleet manager.</p>
              )}
            </motion.div>
          )}

          {phase === 'odometer' && (
            <motion.div
              key="odometer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="min-h-screen bg-[#0A0F1E] flex flex-col px-6 pt-16 pb-8"
            >
              <button
                type="button"
                onClick={() => setPhase('vehicle')}
                className="flex items-center gap-2 text-slate-400 text-sm mb-8 self-start"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono text-center">
                  STEP 1 OF 3
                </div>
                <h2 className="text-2xl font-display font-bold text-white text-center mb-2">Current Odometer</h2>
                <p className="text-slate-400 text-sm text-center mb-8">Enter the mileage shown on the dashboard</p>
                <div className="relative mb-8">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder={vehicle?.current_mileage?.toString() ?? ''}
                    className="w-full text-center text-3xl font-mono font-bold text-white bg-white/[0.04] border-2 border-white/[0.1] rounded-2xl py-6 px-4 focus:outline-none focus:border-blue-500/60 transition-all"
                    style={{ fontSize: '16px' }}
                    onBlur={() => {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
                    }}
                  />
                  <div className="text-center text-xs text-slate-600 mt-2">miles</div>
                </div>
                {odometerError && <p className="text-sm text-red-400 text-center mb-2">{odometerError}</p>}
                <button
                  type="button"
                  disabled={!canContinueOdometer}
                  onClick={() => {
                    setPhase('checklist')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="min-h-screen bg-[#0A0F1E] flex flex-col pt-16 pb-8"
            >
              <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-mono">
                    {categoryIndex + 1} / {categories.length}
                  </span>
                  <span className="text-xs text-slate-500">{activeCategory}</span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    animate={{
                      width: `${((categoryIndex + 1) / categories.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div className="px-6 mb-6">
                <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-1">
                  CATEGORY {categoryIndex + 1}
                </div>
                <h2 className="text-2xl font-display font-bold text-white">{activeCategory}</h2>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-1 px-6 space-y-3"
                >
                  {activeCategoryItems.map((it) => {
                    const a = answers[it.id] || { status: null, note: '' }
                    return (
                      <div key={it.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
                        <div className="p-4">
                          <p className="text-base text-white font-medium mb-4 leading-snug">{it.label}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [it.id]: { ...a, status: 'pass' } }))
                              }
                              className={`py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                                a.status === 'pass'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
                              }`}
                            >
                              ✓ Pass
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [it.id]: { ...a, status: 'fail' } }))
                              }
                              className={`py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                                a.status === 'fail'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]'
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
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3">
                                  <textarea
                                    value={a.note}
                                    onChange={(e) =>
                                      setAnswers((prev) => ({ ...prev, [it.id]: { ...a, note: e.target.value } }))
                                    }
                                    placeholder="Describe the issue... (required)"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/[0.04] border border-red-500/30 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/60 transition-all resize-none"
                                    style={{ fontSize: '16px' }}
                                    onBlur={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)}
                                  />
                                  {(!a.note || !a.note.trim()) && (
                                    <p className="text-xs text-red-400 mt-1">Please describe the issue to continue</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
              <div className="px-6 mt-6">
                <button
                  type="button"
                  disabled={
                    !activeCategoryItems.every(
                      (item) =>
                        answers[item.id]?.status !== undefined &&
                        (answers[item.id]?.status === 'pass' || (answers[item.id]?.note ?? '').trim() !== '')
                    )
                  }
                  onClick={() => {
                    if (categoryIndex < categories.length - 1) {
                      setCategoryIndex((prev) => prev + 1)
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
                    } else {
                      setPhase('summary')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  {categoryIndex < categories.length - 1 ? 'Next Category' : 'Review Summary'}{' '}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="min-h-screen bg-[#0A0F1E] pt-16 pb-24 px-6"
          >
            <div className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-2 text-center">
              SUMMARY
            </div>
            <h2 className="text-2xl font-display font-bold text-white text-center mb-6">Review & Submit</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                <div className="text-3xl font-mono font-bold text-emerald-400 mb-1">{passedCount}</div>
                <div className="text-xs text-slate-500">Passed</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                <div
                  className={`text-3xl font-mono font-bold mb-1 ${
                    failedItems.length > 0 ? 'text-red-400' : 'text-slate-600'
                  }`}
                >
                  {failedItems.length}
                </div>
                <div className="text-xs text-slate-500">Failed</div>
              </div>
            </div>
            {failedItems.length > 0 && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                    <AlertTriangle size={14} /> Failed items
                  </h3>
                </div>
                {failedItems.map((f) => (
                  <div
                    key={f.id}
                    className="px-4 py-3 border-b border-white/[0.04] last:border-0"
                  >
                    <p className="text-sm text-white mb-1">{f.label}</p>
                    <p className="text-xs text-slate-500">{answers[f.id]?.note ?? ''}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mb-6">
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">
                Additional notes (optional)
              </label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Any other observations about the vehicle..."
                rows={3}
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-all resize-none"
                style={{ fontSize: '16px' }}
                onBlur={() =>
                  setTimeout(
                    () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
                    300
                  )
                }
              />
            </div>
            {submitError && <p className="text-sm text-red-300 mb-4">{submitError}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit Inspection <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </motion.div>
        )}

        {phase === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                failedItems.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
              }`}
            >
              {failedItems.length > 0 ? (
                <AlertTriangle size={36} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={36} className="text-emerald-400" />
              )}
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              {failedItems.length > 0 ? 'Inspection Submitted' : 'All Clear!'}
            </h2>
            <p className="text-slate-400 text-sm mb-2">
              {failedItems.length > 0
                ? `${failedItems.length} issue${failedItems.length > 1 ? 's' : ''} reported to your fleet manager`
                : 'Vehicle passed all inspection items'}
            </p>
            <p className="text-xs text-slate-600 mb-8 font-mono">{new Date().toLocaleString()}</p>
            <button
              type="button"
              onClick={() => router.push('/driver')}
              className="rounded-2xl bg-blue-500 text-white px-8 py-3.5 flex items-center justify-center gap-2 font-semibold hover:bg-blue-600"
            >
              Back to Dashboard <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </InspectionErrorBoundary>
  )
}

