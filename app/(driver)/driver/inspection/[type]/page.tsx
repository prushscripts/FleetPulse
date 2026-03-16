'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4

type ChecklistItem = {
  id: string
  label: string
  category: string
  passed: boolean | null
  note: string
}

const BASE_ITEMS: ChecklistItem[] = [
  { id: 'lights', label: 'Lights and signals', category: 'Exterior', passed: null, note: '' },
  { id: 'tires', label: 'Tires and wheels', category: 'Exterior', passed: null, note: '' },
  { id: 'fluids', label: 'Engine fluids check', category: 'Under Hood', passed: null, note: '' },
  { id: 'brakes', label: 'Brakes and steering', category: 'Interior', passed: null, note: '' },
  { id: 'safety', label: 'Safety kit present', category: 'Safety', passed: null, note: '' },
]

export default function DriverInspectionFlowPage() {
  const params = useParams<{ type: string }>()
  const type = params?.type ?? 'pre_trip'
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>(1)
  const [odometer, setOdometer] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>(BASE_ITEMS)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(true)

  const inspectionType = type === 'post_trip' ? 'post_trip' : 'pre_trip'

  useEffect(() => {
    const loadTemplate = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const companyId = user?.user_metadata?.company_id as string | undefined
      if (!companyId) {
        setTemplateLoading(false)
        return
      }
      const { data: row } = await supabase
        .from('inspection_templates')
        .select('id, items')
        .eq('company_id', companyId)
        .eq('type', inspectionType)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle()
      const raw = (row as { items?: unknown } | null)?.items
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: ChecklistItem[] = raw.map((i: Record<string, unknown>) => ({
          id: String(i.id ?? ''),
          label: String(i.label ?? ''),
          category: String(i.category ?? ''),
          passed: null,
          note: '',
        }))
        setItems(mapped)
      }
      setTemplateLoading(false)
    }
    loadTemplate()
  }, [supabase, inspectionType])

  const currentIndex = useMemo(() => items.findIndex((i) => i.passed === null), [items])
  const currentItem = currentIndex >= 0 ? items[currentIndex] : null
  const failedCount = items.filter((i) => i.passed === false).length
  const passedCount = items.filter((i) => i.passed === true).length
  const percent = Math.round(((items.length - Math.max(currentIndex, 0)) / items.length) * 100)

  const setResult = (passed: boolean) => {
    if (!currentItem) return
    setItems((prev) =>
      prev.map((item) => (item.id === currentItem.id ? { ...item, passed } : item)),
    )
  }

  const submitInspection = async () => {
    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', user.email ?? '')
        .maybeSingle()

      const { data: vehicle } = driver
        ? await supabase.from('vehicles').select('id').eq('driver_id', driver.id).maybeSingle()
        : { data: null as any }

      await supabase.from('inspections').insert({
        company_id: (user.user_metadata?.company_id as string | undefined) ?? null,
        vehicle_id: vehicle?.id ?? null,
        driver_id: driver?.id ?? null,
        submitted_by_user_id: user.id,
        type: inspectionType,
        status: failedCount > 0 ? 'needs_review' : 'passed',
        odometer: Number(odometer || 0),
        results: items.map((i) => ({
          itemId: i.id,
          label: i.label,
          passed: i.passed === true,
          note: i.note || '',
        })),
        notes,
      })
      setStep(4)
    } finally {
      setSubmitting(false)
    }
  }

  if (templateLoading) {
    return (
      <div className="card-glass rounded-2xl p-5 text-center text-slate-400 py-8">Loading checklist…</div>
    )
  }

  return (
    <div className="card-glass rounded-2xl p-5">
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-xl font-display font-bold text-white">Enter odometer reading</h1>
          <input
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            inputMode="numeric"
            className="input-field"
            placeholder="Current mileage"
          />
          <button
            type="button"
            className="btn-primary w-full py-3"
            disabled={!odometer.trim()}
            onClick={() => setStep(2)}
          >
            Start Inspection →
          </button>
        </div>
      )}

      {step === 2 && currentItem && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">Item {currentIndex + 1} of {items.length}</div>
          <div className="h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
          </div>
          <h2 className="text-lg font-semibold text-white">{currentItem.label}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="min-h-[56px] rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium" onClick={() => setResult(true)}>
              ✓ Pass
            </button>
            <button type="button" className="min-h-[56px] rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-medium" onClick={() => setResult(false)}>
              ✗ Fail
            </button>
          </div>
          <textarea
            value={currentItem.note}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((i) => (i.id === currentItem.id ? { ...i, note: e.target.value } : i)),
              )
            }
            className="input-field min-h-[84px]"
            placeholder="Optional note (required for failed items)"
          />
          <button
            type="button"
            className="btn-ghost w-full py-2.5"
            onClick={() => {
              const nextIndex = items.findIndex((i) => i.passed === null)
              if (nextIndex < 0) setStep(3)
            }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Summary</h2>
          <p className="text-sm text-slate-400">
            {passedCount} passed, {failedCount} failed
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field min-h-[96px]"
            placeholder="Overall vehicle notes"
          />
          <button type="button" disabled={submitting} className="btn-primary w-full py-3" onClick={submitInspection}>
            {submitting ? 'Submitting...' : 'Submit Inspection'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-10 space-y-3">
          <h2 className="text-2xl font-display font-bold text-white">Inspection submitted ✓</h2>
          <p className="text-sm text-slate-400">{new Date().toLocaleString()}</p>
          <button type="button" className="btn-primary px-4 py-2.5" onClick={() => router.push('/driver')}>
            Back to Driver Home
          </button>
        </div>
      )}
    </div>
  )
}

